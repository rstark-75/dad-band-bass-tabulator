import { AuthApi, AuthApiError } from '../api/authApi.ts';
import type { AuthEvent } from './authReducer.ts';
import type { AuthStoreState, AuthView } from './authTypes.ts';
import { toAuthErrorMessage } from '../utils/authErrorMessage.ts';
import { isValidEmail, normalizeEmail } from '../utils/email.ts';

interface ActionDeps {
  api: AuthApi | null;
  dispatch: (event: AuthEvent) => void;
  getState: () => AuthStoreState;
}

const normalizeHandle = (value: string): string => value.trim().toLowerCase();
const isValidHandle = (value: string): boolean => /^[a-z0-9_-]{3,30}$/.test(value);
const isValidPassword = (value: string): boolean => value.length >= 8 && value.length <= 128;

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

  const setInfo = (infoMessage: string | null) => {
    dispatch({ type: 'setInfo', infoMessage });
  };

  const syncDrafts = ({
    email,
    password,
    handle,
    avatarUrl,
  }: {
    email?: string;
    password?: string;
    handle?: string;
    avatarUrl?: string;
  }) => {
    dispatch({ type: 'setDraftCredentials', email, password, handle, avatarUrl });
  };

  const restoreSession = async () => {
    dispatch({ type: 'setLoading', loadingAction: 'restoreSession' });
    dispatch({ type: 'setRestoring' });
    setError(null);

    try {
      const session = await requireApi().getSession();
      dispatch({ type: 'setAuthenticated', user: session.user });
      syncDrafts({
        email: session.user.email,
        password: '',
        handle: session.user.userId,
        avatarUrl: session.user.avatarUrl ?? '',
      });
      setInfo(null);
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

  const setAuthView = (authView: AuthView) => {
    dispatch({ type: 'setAuthView', authView });
    setError(null);
    setInfo(null);
  };

  const clearError = () => {
    setError(null);
  };

  const clearInfo = () => {
    setInfo(null);
  };

  const login = async ({ rawEmail, rawPassword }: { rawEmail: string; rawPassword: string }) => {
    const email = normalizeEmail(rawEmail);
    const password = rawPassword;
    syncDrafts({ email, password });
    setError(null);
    setInfo(null);

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!isValidPassword(password)) {
      setError('Password must be 8-128 characters.');
      return;
    }

    dispatch({ type: 'setLoading', loadingAction: 'login' });

    try {
      const response = await requireApi().login({ email, password });
      dispatch({ type: 'setAuthenticated', user: response.user });
      syncDrafts({
        email: response.user.email,
        password: '',
        handle: response.user.userId,
        avatarUrl: response.user.avatarUrl ?? '',
      });
    } catch (error) {
      setError(toAuthErrorMessage('login', error));
    } finally {
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const register = async ({
    rawEmail,
    rawPassword,
    rawHandle,
    rawAvatarUrl,
  }: {
    rawEmail: string;
    rawPassword: string;
    rawHandle: string;
    rawAvatarUrl?: string;
  }) => {
    const email = normalizeEmail(rawEmail);
    const password = rawPassword;
    const handle = normalizeHandle(rawHandle);
    const avatarUrl = (rawAvatarUrl ?? '').trim();
    syncDrafts({ email, password, handle, avatarUrl });
    setError(null);
    setInfo(null);

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!isValidPassword(password)) {
      setError('Password must be 8-128 characters.');
      return;
    }

    if (!isValidHandle(handle)) {
      setError('Handle must be 3-30 characters using lowercase letters, numbers, underscores, or hyphens.');
      return;
    }

    dispatch({ type: 'setLoading', loadingAction: 'register' });

    try {
      const response = await requireApi().register({
        email,
        password,
        handle,
        avatarUrl: avatarUrl || undefined,
      });
      dispatch({ type: 'setAuthView', authView: 'LOGIN' });
      dispatch({ type: 'setDraftCredentials', password: '' });
      setInfo(`Check ${response.maskedEmail} for your verification link.`);
    } catch (error) {
      setError(toAuthErrorMessage('register', error));
    } finally {
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const forgotPassword = async ({ rawEmail }: { rawEmail: string }) => {
    const email = normalizeEmail(rawEmail);
    syncDrafts({ email });
    setError(null);
    setInfo(null);

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    dispatch({ type: 'setLoading', loadingAction: 'forgotPassword' });

    try {
      await requireApi().forgotPassword({ email });
      setInfo(`If that email exists, you'll receive a reset link.`);
    } catch (error) {
      setError(toAuthErrorMessage('forgotPassword', error));
    } finally {
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const verifyEmail = async (token: string) => {
    const trimmedToken = token.trim();
    setError(null);
    setInfo(null);

    if (!trimmedToken) {
      dispatch({ type: 'setUnauthenticated' });
      setError('This verification link is invalid or has expired.');
      return;
    }

    dispatch({ type: 'setLoading', loadingAction: 'verifyEmail' });

    try {
      const response = await requireApi().verifyEmail({ token: trimmedToken });
      dispatch({ type: 'setAuthenticated', user: response.user });
      syncDrafts({
        email: response.user.email,
        password: '',
        handle: response.user.userId,
        avatarUrl: response.user.avatarUrl ?? '',
      });
    } catch (error) {
      dispatch({ type: 'setUnauthenticated' });
      setError(toAuthErrorMessage('verifyEmail', error));
    } finally {
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const resetPassword = async ({
    token,
    rawNewPassword,
  }: {
    token: string;
    rawNewPassword: string;
  }) => {
    const trimmedToken = token.trim();
    const newPassword = rawNewPassword;
    setError(null);
    setInfo(null);

    if (!trimmedToken) {
      setError('This reset link is invalid or has expired.');
      return false;
    }

    if (!isValidPassword(newPassword)) {
      setError('Password must be 8-128 characters.');
      return false;
    }

    dispatch({ type: 'setLoading', loadingAction: 'resetPassword' });

    try {
      await requireApi().resetPassword({ token: trimmedToken, newPassword });
      dispatch({ type: 'setDraftCredentials', password: '' });
      return true;
    } catch (error) {
      setError(toAuthErrorMessage('resetPassword', error));
      return false;
    } finally {
      dispatch({ type: 'setLoading', loadingAction: null });
    }
  };

  const logout = async () => {
    const current = getState().authState;
    const fallbackEmail = current.type === 'AUTHENTICATED' ? current.user.email : getState().draftEmail;
    const fallbackHandle = current.type === 'AUTHENTICATED' ? current.user.userId : getState().draftHandle;

    dispatch({ type: 'setLoading', loadingAction: 'logout' });
    setError(null);
    setInfo(null);

    try {
      if (api) {
        await api.logout();
      }
    } catch (error) {
      console.warn('Auth logout failed', error);
      setError(toAuthErrorMessage('logout', error));
    } finally {
      syncDrafts({
        email: fallbackEmail,
        password: '',
        handle: fallbackHandle,
        avatarUrl: current.type === 'AUTHENTICATED' ? (current.user.avatarUrl ?? '') : getState().draftAvatarUrl,
      });
      dispatch({ type: 'setUnauthenticated' });
      dispatch({ type: 'setLoading', loadingAction: null });
    }
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
    syncDrafts({
      email: nextUser.email,
      password: '',
      handle: nextUser.userId,
      avatarUrl: nextUser.avatarUrl ?? '',
    });
  };

  return {
    restoreSession,
    setAuthView,
    login,
    register,
    forgotPassword,
    verifyEmail,
    resetPassword,
    logout,
    clearError,
    clearInfo,
    updateLocalProfile,
  };
};
