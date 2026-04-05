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
    if (error.code === 'USER_ID_TAKEN') {
      return 'That user ID is already taken.';
    }

    if (error.code === 'EMAIL_ALREADY_LINKED') {
      return 'That email is already linked to another account.';
    }

    if (error.code === 'ACCOUNT_NOT_FOUND') {
      return 'No account found for that user ID and email.';
    }

    if (error.code === 'USER_EMAIL_MISMATCH') {
      return 'That user ID is linked to a different email.';
    }

    if (error.code === 'RATE_LIMITED' || error.status === 429) {
      return 'Too many attempts. Try again in a minute.';
    }

    return 'We couldn’t send the email right now. Please try again.';
  }

  if (action === 'verifyCode') {
    if (error.code === 'INVALID_OR_EXPIRED_CODE') {
      return 'That code is invalid or expired.';
    }

    if (error.code === 'ACCOUNT_NOT_FOUND') {
      return 'No account found for that user ID and email.';
    }

    if (error.code === 'USER_EMAIL_MISMATCH') {
      return 'That user ID does not match this email.';
    }

    if (error.code === 'RATE_LIMITED' || error.status === 429) {
      return 'Too many attempts. Try again in a minute.';
    }

    if (error.status === 400 || error.status === 401) {
      return 'That code is invalid or expired.';
    }

    return 'We couldn’t verify that code right now.';
  }

  if (action === 'verifyLink') {
    if (error.code === 'ACCOUNT_NOT_FOUND') {
      return 'No account found for this sign-in attempt.';
    }

    if (error.code === 'USER_EMAIL_MISMATCH') {
      return 'This sign-in link does not match your account.';
    }

    if (error.code === 'RATE_LIMITED' || error.status === 429) {
      return 'Too many attempts. Try again in a minute.';
    }

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
