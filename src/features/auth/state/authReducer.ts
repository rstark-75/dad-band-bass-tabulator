import type { UserDto } from '../api/authContracts.ts';
import type { AuthLoadingAction, AuthStoreState } from './authTypes.ts';

export type AuthEvent =
  | { type: 'setLoading'; loadingAction: AuthLoadingAction | null }
  | { type: 'setError'; errorMessage: string | null }
  | { type: 'setDraftEmail'; email: string }
  | { type: 'setRestoring' }
  | { type: 'setUnauthenticated' }
  | {
    type: 'setCheckEmail';
    email: string;
    maskedEmail: string;
    nextAllowedResendAt?: string | null;
  }
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
    case 'setDraftEmail':
      return {
        ...state,
        draftEmail: event.email,
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
    case 'setCheckEmail':
      return {
        ...state,
        authState: {
          type: 'CHECK_EMAIL',
          email: event.email,
          maskedEmail: event.maskedEmail,
          nextAllowedResendAt: event.nextAllowedResendAt,
        },
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
