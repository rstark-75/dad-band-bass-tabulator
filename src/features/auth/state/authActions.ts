import { AuthApi, AuthApiError } from '../api/authApi.ts';
import type { AuthEvent } from './authReducer.ts';
import type { AuthStoreState } from './authTypes.ts';
import { toAuthErrorMessage } from '../utils/authErrorMessage.ts';
import { isValidEmail, normalizeEmail } from '../utils/email.ts';
import { sanitizeCode } from '../utils/codeInput.ts';

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

  const restoreSession = async () => {
    dispatch({ type: 'setLoading', loadingAction: 'restoreSession' });
    dispatch({ type: 'setRestoring' });
    setError(null);

    try {
      const session = await requireApi().getSession();
      dispatch({ type: 'setAuthenticated', user: session.user });
      dispatch({ type: 'setDraftEmail', email: session.user.email });
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

  const startAuth = async (rawEmail: string, mode: 'start' | 'resend' = 'start') => {
    const email = normalizeEmail(rawEmail);
    dispatch({ type: 'setDraftEmail', email });
    setError(null);

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    dispatch({
      type: 'setLoading',
      loadingAction: mode === 'resend' ? 'resendAuth' : 'startAuth',
    });

    try {
      const response = await requireApi().startAuth(email);
      dispatch({
        type: 'setCheckEmail',
        email,
        maskedEmail: response.maskedEmail,
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

    await startAuth(state.email, 'resend');
  };

  const verifyCode = async (rawEmail: string, rawCode: string) => {
    const email = normalizeEmail(rawEmail);
    const code = sanitizeCode(rawCode);
    dispatch({ type: 'setDraftEmail', email });
    setError(null);

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    dispatch({ type: 'setLoading', loadingAction: 'verifyCode' });

    try {
      const response = await requireApi().verifyCode(email, code);
      dispatch({ type: 'setAuthenticated', user: response.user });
      dispatch({ type: 'setDraftEmail', email: response.user.email });
      setError(null);
    } catch (error) {
      try {
        const session = await requireApi().getSession();
        dispatch({ type: 'setAuthenticated', user: session.user });
        dispatch({ type: 'setDraftEmail', email: session.user.email });
        setError(null);
        return;
      } catch (_sessionError) {
        // Continue to user-friendly verify error below.
      }

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
      const response = await requireApi().verifyLink(token.trim());
      dispatch({ type: 'setAuthenticated', user: response.user });
      dispatch({ type: 'setDraftEmail', email: response.user.email });
      setError(null);
    } catch (error) {
      try {
        const session = await requireApi().getSession();
        dispatch({ type: 'setAuthenticated', user: session.user });
        dispatch({ type: 'setDraftEmail', email: session.user.email });
        setError(null);
        return;
      } catch (_sessionError) {
        // Continue to user-friendly verify error below.
      }

      dispatch({ type: 'setUnauthenticated' });
      setError(toAuthErrorMessage('verifyLink', error));
    } finally {
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const useDifferentEmail = () => {
    const current = getState().authState;

    if (current.type === 'CHECK_EMAIL') {
      dispatch({ type: 'setDraftEmail', email: current.email });
    }

    dispatch({ type: 'setUnauthenticated' });
    setError(null);
  };

  const logout = async () => {
    const current = getState().authState;
    const fallbackEmail = current.type === 'AUTHENTICATED' ? current.user.email : getState().draftEmail;

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
      dispatch({ type: 'setDraftEmail', email: fallbackEmail });
      dispatch({ type: 'setUnauthenticated' });
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const clearError = () => {
    setError(null);
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
  };
};
