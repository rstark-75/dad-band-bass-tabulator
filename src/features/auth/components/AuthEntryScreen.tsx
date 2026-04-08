import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { useAuth } from '../state/useAuth';

export function AuthEntryScreen() {
  const { authView } = useAuth();

  if (authView === 'REGISTER') {
    return <RegisterScreen />;
  }

  if (authView === 'FORGOT_PASSWORD') {
    return <ForgotPasswordScreen />;
  }

  return <LoginScreen />;
}
