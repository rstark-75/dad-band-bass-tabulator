import type { UserDto } from '../api/authContracts.ts';
import type { AuthLoadingAction, AuthStoreState, AuthView } from './authTypes.ts';

export type AuthEvent =
  | { type: 'setLoading'; loadingAction: AuthLoadingAction | null }
  | { type: 'setError'; errorMessage: string | null }
  | { type: 'setInfo'; infoMessage: string | null }
  | { type: 'setAuthView'; authView: AuthView }
  | { type: 'setDraftCredentials'; email?: string; password?: string; handle?: string; avatarUrl?: string }
  | { type: 'setRestoring' }
  | { type: 'setUnauthenticated' }
  | { type: 'setAuthenticated'; user: UserDto };

export const authReducer = (
  state: AuthStoreState,
  event: AuthEvent,
): AuthStoreState => {
  switch (event.type) {
    case 'setLoading':
      return {
        ...state,
        loadingAction: event.loadingAction,
      };
    case 'setError':
      return {
        ...state,
        errorMessage: event.errorMessage,
      };
    case 'setInfo':
      return {
        ...state,
        infoMessage: event.infoMessage,
      };
    case 'setAuthView':
      return {
        ...state,
        authView: event.authView,
      };
    case 'setDraftCredentials':
      return {
        ...state,
        draftEmail: event.email ?? state.draftEmail,
        draftPassword: event.password ?? state.draftPassword,
        draftHandle: event.handle ?? state.draftHandle,
        draftAvatarUrl: event.avatarUrl ?? state.draftAvatarUrl,
      };
    case 'setRestoring':
      return {
        ...state,
        authState: { type: 'RESTORING_SESSION' },
      };
    case 'setUnauthenticated':
      return {
        ...state,
        authState: { type: 'UNAUTHENTICATED' },
      };
    case 'setAuthenticated':
      return {
        ...state,
        authState: {
          type: 'AUTHENTICATED',
          user: event.user,
        },
      };
    default:
      return state;
  }
};

export const getAuthRouteMode = (
  state: AuthStoreState['authState'],
): 'restoring' | 'auth' | 'app' => {
  if (state.type === 'RESTORING_SESSION') {
    return 'restoring';
  }

  if (state.type === 'AUTHENTICATED') {
    return 'app';
  }

  return 'auth';
};
