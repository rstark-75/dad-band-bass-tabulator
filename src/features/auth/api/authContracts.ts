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

export interface StartAuthRequest {
  userId: string;
  email?: string;
  mode: 'LOGIN' | 'REGISTER';
  avatarUrl?: string;
}

export interface StartAuthResponse {
  status: 'EMAIL_SENT';
  maskedEmail: string;
  email?: string;
  nextAllowedResendAt?: string | null;
}

export interface VerifyLinkRequest {
  token: string;
}

export interface VerifyCodeRequest {
  userId: string;
  email?: string;
  code: string;
}

export interface AuthenticatedResponse {
  status: 'AUTHENTICATED';
  user: UserDto;
}

export interface LogoutResponse {
  status: 'SIGNED_OUT';
}
