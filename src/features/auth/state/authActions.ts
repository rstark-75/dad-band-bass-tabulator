import { AuthApi, AuthApiError } from '../api/authApi.ts';
import type { AuthEvent } from './authReducer.ts';
import type { AuthIntent, AuthStoreState } from './authTypes.ts';
import { toAuthErrorMessage } from '../utils/authErrorMessage.ts';
import { isValidEmail, normalizeEmail } from '../utils/email.ts';
import { sanitizeCode } from '../utils/codeInput.ts';
import { isValidUserId, normalizeUserId } from '../utils/userId.ts';

interface ActionDeps {
  api: AuthApi | null;
  dispatch: (event: AuthEvent) => void;
  getState: () => AuthStoreState;
}

export const createAuthActions = ({ api, dispatch, getState }: ActionDeps) => {
  const requireApi = (): AuthApi => {
    if (!api) {
      throw new AuthApiError('Auth API base URL is not configured.');
    }

    return api;
  };

  const setError = (errorMessage: string | null) => {
    dispatch({ type: 'setError', errorMessage });
  };

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  const resolveSessionAfterAuth = async () => {
    const retryDelaysMs = [0, 150, 400];
    let lastError: unknown = null;

    for (const delayMs of retryDelaysMs) {
      if (delayMs > 0) {
        await sleep(delayMs);
      }

      try {
        return await requireApi().getSession();
      } catch (error) {
        lastError = error;

        if (!(error instanceof AuthApiError) || error.status !== 401) {
          throw error;
        }
      }
    }

    throw lastError ?? new AuthApiError('Authentication required.');
  };

  const restoreSession = async () => {
    dispatch({ type: 'setLoading', loadingAction: 'restoreSession' });
    dispatch({ type: 'setRestoring' });
    setError(null);

    try {
      const session = await requireApi().getSession();
      dispatch({ type: 'setAuthenticated', user: session.user });
      dispatch({
        type: 'setDraftSignIn',
        userId: session.user.userId,
        email: session.user.email,
        avatarUrl: session.user.avatarUrl ?? '',
      });
      setError(null);
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) {
        dispatch({ type: 'setUnauthenticated' });
        setError(null);
      } else {
        dispatch({ type: 'setUnauthenticated' });
        setError(toAuthErrorMessage('restore', error));
      }
    } finally {
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const startAuth = async (
    {
      rawUserId,
      rawEmail,
      rawAvatarUrl,
      intent,
    }: {
      rawUserId: string;
      rawEmail?: string;
      rawAvatarUrl?: string;
      intent: AuthIntent;
    },
    mode: 'start' | 'resend' = 'start',
  ) => {
    const userId = normalizeUserId(rawUserId);
    const email = rawEmail ? normalizeEmail(rawEmail) : '';
    const avatarUrl = (rawAvatarUrl ?? '').trim();
    dispatch({ type: 'setDraftSignIn', userId, email, avatarUrl, intent });
    setError(null);

    if (!isValidUserId(userId)) {
      setError('Choose a user ID with 3-24 lowercase letters, numbers, or underscores.');
      return;
    }

    if (intent === 'REGISTER' && !isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    dispatch({
      type: 'setLoading',
      loadingAction: mode === 'resend' ? 'resendAuth' : 'startAuth',
    });

    try {
      const response = await requireApi().startAuth({
        userId,
        email: email || undefined,
        mode: intent,
        avatarUrl: avatarUrl || undefined,
      });
      dispatch({
        type: 'setCheckEmail',
        userId,
        email: response.email ?? email,
        maskedEmail: response.maskedEmail,
        mode: intent,
        avatarUrl: avatarUrl || undefined,
        nextAllowedResendAt: response.nextAllowedResendAt,
      });
      setError(null);
    } catch (error) {
      setError(toAuthErrorMessage(mode, error));
    } finally {
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const resendAuth = async () => {
    const state = getState().authState;

    if (state.type !== 'CHECK_EMAIL') {
      return;
    }

    await startAuth(
      {
        rawUserId: state.userId,
        rawEmail: state.email,
        rawAvatarUrl: state.avatarUrl,
        intent: state.mode,
      },
      'resend',
    );
  };

  const verifyCode = async (
    {
      rawUserId,
      rawEmail,
      rawCode,
    }: {
      rawUserId: string;
      rawEmail?: string;
      rawCode: string;
    },
  ) => {
    const userId = normalizeUserId(rawUserId);
    const email = rawEmail ? normalizeEmail(rawEmail) : '';
    const code = sanitizeCode(rawCode);
    dispatch({ type: 'setDraftSignIn', userId, email, avatarUrl: getState().draftAvatarUrl });
    setError(null);

    if (!isValidUserId(userId)) {
      setError('Invalid user ID.');
      return;
    }

    if (email && !isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    dispatch({ type: 'setLoading', loadingAction: 'verifyCode' });

    try {
      const authResponse = await requireApi().verifyCode({ userId, email: email || undefined, code });
      dispatch({ type: 'setAuthenticated', user: authResponse.user });
      dispatch({
        type: 'setDraftSignIn',
        userId: authResponse.user.userId,
        email: authResponse.user.email,
        avatarUrl: authResponse.user.avatarUrl ?? '',
      });
      setError(null);
    } catch (error) {
      setError(toAuthErrorMessage('verifyCode', error));
    } finally {
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const verifyLink = async (token: string) => {
    setError(null);

    if (!token.trim()) {
      dispatch({ type: 'setUnauthenticated' });
      setError('This sign-in link is invalid or has expired.');
      return;
    }

    dispatch({ type: 'setLoading', loadingAction: 'verifyLink' });

    try {
      const authResponse = await requireApi().verifyLink(token.trim());
      dispatch({ type: 'setAuthenticated', user: authResponse.user });
      dispatch({
        type: 'setDraftSignIn',
        userId: authResponse.user.userId,
        email: authResponse.user.email,
        avatarUrl: authResponse.user.avatarUrl ?? '',
      });
      setError(null);
    } catch (error) {
      dispatch({ type: 'setUnauthenticated' });
      setError(toAuthErrorMessage('verifyLink', error));
    } finally {
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const useDifferentEmail = () => {
    const current = getState().authState;

    if (current.type === 'CHECK_EMAIL') {
      dispatch({
        type: 'setDraftSignIn',
        userId: current.userId,
        email: current.email,
        avatarUrl: current.avatarUrl ?? '',
        intent: current.mode,
      });
    }

    dispatch({ type: 'setUnauthenticated' });
    setError(null);
  };

  const logout = async () => {
    const current = getState().authState;
    const fallbackUserId = current.type === 'AUTHENTICATED' ? current.user.userId : getState().draftUserId;
    const fallbackEmail = current.type === 'AUTHENTICATED' ? current.user.email : getState().draftEmail;
    const fallbackAvatar = current.type === 'AUTHENTICATED'
      ? (current.user.avatarUrl ?? '')
      : getState().draftAvatarUrl;

    dispatch({ type: 'setLoading', loadingAction: 'logout' });
    setError(null);

    try {
      if (api) {
        await api.logout();
      }
    } catch (error) {
      console.warn('Auth logout failed', error);
      setError(toAuthErrorMessage('logout', error));
    } finally {
      dispatch({
        type: 'setDraftSignIn',
        userId: fallbackUserId,
        email: fallbackEmail,
        avatarUrl: fallbackAvatar,
      });
      dispatch({ type: 'setUnauthenticated' });
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const clearError = () => {
    setError(null);
  };

  const updateLocalProfile = (updates: { avatarUrl?: string | null }) => {
    const current = getState().authState;

    if (current.type !== 'AUTHENTICATED') {
      return;
    }

    const nextUser = {
      ...current.user,
      ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
    };

    dispatch({ type: 'setAuthenticated', user: nextUser });
    dispatch({
      type: 'setDraftSignIn',
      userId: nextUser.userId,
      email: nextUser.email,
      avatarUrl: nextUser.avatarUrl ?? '',
    });
  };

  return {
    restoreSession,
    startAuth,
    resendAuth,
    verifyCode,
    verifyLink,
    useDifferentEmail,
    logout,
    clearError,
    updateLocalProfile,
  };
};
