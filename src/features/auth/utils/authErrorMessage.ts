import { AuthApiError } from '../api/authApi.ts';

type AuthAction = 'restore' | 'start' | 'resend' | 'verifyCode' | 'verifyLink' | 'logout';

export const toAuthErrorMessage = (action: AuthAction, error: unknown): string => {
  if (action === 'restore') {
    return 'We could not restore your session. Please sign in again.';
  }

  if (!(error instanceof AuthApiError)) {
    if (action === 'verifyCode') {
      return 'We couldn’t verify that code right now.';
    }

    if (action === 'verifyLink') {
      return 'We couldn’t verify that sign-in link right now.';
    }

    if (action === 'logout') {
      return 'Could not sign out cleanly. You have been signed out locally.';
    }

    return 'Something went wrong. Please try again.';
  }

  if (action === 'start' || action === 'resend') {
    return 'We couldn’t send the email right now. Please try again.';
  }

  if (action === 'verifyCode') {
    if (error.status === 400 || error.status === 401) {
      return 'That code is invalid or expired.';
    }

    return 'We couldn’t verify that code right now.';
  }

  if (action === 'verifyLink') {
    if (error.status === 400 || error.status === 401) {
      return 'This sign-in link is invalid or has expired.';
    }

    return 'We couldn’t verify that sign-in link right now.';
  }

  if (action === 'logout') {
    return 'Could not sign out cleanly. You have been signed out locally.';
  }

  return 'Something went wrong. Please try again.';
};
