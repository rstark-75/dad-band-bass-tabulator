export interface UserDto {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  subscriptionTier?: 'FREE' | 'PRO';
}

export interface SessionResponse {
  authenticated: true;
  user: UserDto;
}

export interface RegisterRequest {
  email: string;
  password: string;
  handle: string;
  avatarUrl?: string;
}

export interface RegisterResponse {
  status: 'VERIFICATION_EMAIL_SENT';
  maskedEmail: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthenticatedResponse {
  status: 'AUTHENTICATED';
  user: UserDto;
}

export interface LogoutResponse {
  status: 'SIGNED_OUT';
}
