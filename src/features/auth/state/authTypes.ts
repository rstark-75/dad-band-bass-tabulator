import type { UserDto } from '../api/authContracts.ts';

export type AuthIntent = 'LOGIN' | 'REGISTER';

export type AuthState =
  | { type: 'RESTORING_SESSION' }
  | { type: 'UNAUTHENTICATED' }
  | {
    type: 'CHECK_EMAIL';
    userId: string;
    email: string;
    maskedEmail: string;
    mode: AuthIntent;
    avatarUrl?: string;
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
  draftUserId: string;
  draftEmail: string;
  draftAvatarUrl: string;
  draftIntent: AuthIntent;
}

export const initialAuthStoreState: AuthStoreState = {
  authState: { type: 'RESTORING_SESSION' },
  loadingAction: null,
  errorMessage: null,
  draftUserId: '',
  draftEmail: '',
  draftAvatarUrl: '',
  draftIntent: 'LOGIN',
};
