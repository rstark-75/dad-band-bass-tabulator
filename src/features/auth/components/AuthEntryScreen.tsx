import { CheckEmailScreen } from './CheckEmailScreen';
import { SignInScreen } from './SignInScreen';
import { useAuth } from '../state/useAuth';

export function AuthEntryScreen() {
  const { authState } = useAuth();

  if (authState.type === 'CHECK_EMAIL') {
    return <CheckEmailScreen />;
  }

  return <SignInScreen />;
}
