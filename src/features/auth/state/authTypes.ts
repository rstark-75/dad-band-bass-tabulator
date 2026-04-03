import type { UserDto } from '../api/authContracts.ts';

export type AuthState =
  | { type: 'RESTORING_SESSION' }
  | { type: 'UNAUTHENTICATED' }
  | {
    type: 'CHECK_EMAIL';
    email: string;
    maskedEmail: string;
    nextAllowedResendAt?: string | null;
  }
  | {
    type: 'AUTHENTICATED';
    user: UserDto;
  };

export type AuthLoadingAction =
  | 'restoreSession'
  | 'startAuth'
  | 'resendAuth'
  | 'verifyLink'
  | 'verifyCode'
  | 'logout';

export interface AuthStoreState {
  authState: AuthState;
  loadingAction: AuthLoadingAction | null;
  errorMessage: string | null;
  draftEmail: string;
}

export const initialAuthStoreState: AuthStoreState = {
  authState: { type: 'RESTORING_SESSION' },
  loadingAction: null,
  errorMessage: null,
  draftEmail: '',
};
