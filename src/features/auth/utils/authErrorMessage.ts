import { AuthApiError } from '../api/authApi.ts';

type AuthAction =
  | 'restore'
  | 'register'
  | 'login'
  | 'forgotPassword'
  | 'verifyEmail'
  | 'resetPassword'
  | 'logout';

export const toAuthErrorMessage = (action: AuthAction, error: unknown): string => {
  if (action === 'restore') {
    return 'We could not restore your session. Please sign in again.';
  }

  if (!(error instanceof AuthApiError)) {
    if (action === 'verifyEmail') {
      return 'We could not verify that email link right now.';
    }

    if (action === 'resetPassword') {
      return 'We could not reset your password right now.';
    }

    if (action === 'logout') {
      return 'Could not sign out cleanly. You have been signed out locally.';
    }

    return 'Something went wrong. Please try again.';
  }

  if (action === 'register') {
    if (error.code === 'EMAIL_ALREADY_LINKED') {
      return 'That email is already linked to an account.';
    }

    if (error.code === 'HANDLE_TAKEN') {
      return 'That handle is already taken.';
    }

    if (error.code === 'RATE_LIMITED' || error.status === 429) {
      return 'Too many attempts. Try again in a minute.';
    }

    return 'We could not create your account right now.';
  }

  if (action === 'login') {
    if (error.code === 'INVALID_CREDENTIALS' || error.status === 401) {
      return 'Incorrect email or password.';
    }

    if (error.code === 'EMAIL_NOT_VERIFIED' || error.status === 403) {
      return 'Verify your email before signing in.';
    }

    if (error.code === 'PASSWORD_NOT_SET') {
      return 'This account does not have a password yet.';
    }

    if (error.code === 'RATE_LIMITED' || error.status === 429) {
      return 'Too many attempts. Try again in a minute.';
    }

    return 'We could not sign you in right now.';
  }

  if (action === 'forgotPassword') {
    if (error.code === 'RATE_LIMITED' || error.status === 429) {
      return 'Too many attempts. Try again in a minute.';
    }

    return 'We could not send a reset email right now.';
  }

  if (action === 'verifyEmail') {
    if (error.code === 'INVALID_OR_EXPIRED_TOKEN' || error.status === 400 || error.status === 401) {
      return 'This verification link is invalid or has expired.';
    }

    if (error.code === 'RATE_LIMITED' || error.status === 429) {
      return 'Too many attempts. Try again in a minute.';
    }

    return 'We could not verify that email link right now.';
  }

  if (action === 'resetPassword') {
    if (error.code === 'INVALID_OR_EXPIRED_TOKEN' || error.status === 400 || error.status === 401) {
      return 'This reset link is invalid or has expired.';
    }

    if (error.code === 'RATE_LIMITED' || error.status === 429) {
      return 'Too many attempts. Try again in a minute.';
    }

    return 'We could not reset your password right now.';
  }

  if (action === 'logout') {
    return 'Could not sign out cleanly. You have been signed out locally.';
  }

  return 'Something went wrong. Please try again.';
};
