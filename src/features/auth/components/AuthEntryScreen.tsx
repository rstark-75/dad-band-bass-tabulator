import { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { useAuth } from '../state/useAuth';
import { RootStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthEntry'>;

export function AuthEntryScreen({ navigation, route }: Props) {
  const { authState, authView, setAuthView } = useAuth();
  const requestedView = route.params?.view;

  useEffect(() => {
    if (authState.type === 'AUTHENTICATED') {
      navigation.replace('MainTabs');
    }
  }, [authState.type, navigation]);

  useEffect(() => {
    if (!requestedView) {
      return;
    }

    if (requestedView !== authView) {
      setAuthView(requestedView);
    }

    // Consume deep-link/entry intent so local auth-view switches are not overridden.
    navigation.setParams({
      view: undefined,
      source: undefined,
    });
  }, [authView, navigation, requestedView, setAuthView]);

  if (authView === 'REGISTER') {
    return <RegisterScreen />;
  }

  if (authView === 'FORGOT_PASSWORD') {
    return <ForgotPasswordScreen />;
  }

  return <LoginScreen />;
}
