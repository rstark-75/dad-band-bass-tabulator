import type { UserDto } from '../api/authContracts.ts';

export type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

export type AuthState =
  | { type: 'RESTORING_SESSION' }
  | { type: 'UNAUTHENTICATED' }
  | {
    type: 'AUTHENTICATED';
    user: UserDto;
  };

export type AuthLoadingAction =
  | 'restoreSession'
  | 'login'
  | 'register'
  | 'forgotPassword'
  | 'verifyEmail'
  | 'resetPassword'
  | 'logout';

export interface AuthStoreState {
  authState: AuthState;
  loadingAction: AuthLoadingAction | null;
  errorMessage: string | null;
  infoMessage: string | null;
  authView: AuthView;
  draftEmail: string;
  draftPassword: string;
  draftHandle: string;
  draftAvatarUrl: string;
}

export const initialAuthStoreState: AuthStoreState = {
  authState: { type: 'RESTORING_SESSION' },
  loadingAction: null,
  errorMessage: null,
  infoMessage: null,
  authView: 'LOGIN',
  draftEmail: '',
  draftPassword: '',
  draftHandle: '',
  draftAvatarUrl: '',
};
