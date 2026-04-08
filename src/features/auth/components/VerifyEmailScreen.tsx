import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { palette } from '../../../constants/colors';
import { RootStackParamList } from '../../../navigation/types';
import { useAuth } from '../state/useAuth';
import { authScreenStyles as styles } from './authScreenStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ route, navigation }: Props) {
  const { authState, errorMessage, loadingAction, verifyEmail, clearError, setAuthView } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const fallbackTokenFromUrl = useMemo(() => {
    if (
      typeof globalThis === 'undefined' ||
      typeof (globalThis as { location?: { search?: unknown } }).location?.search !== 'string'
    ) {
      return '';
    }

    try {
      const search = (globalThis as { location?: { search?: string } }).location?.search ?? '';
      const query = new URLSearchParams(search);
      return query.get('token')?.trim() ?? '';
    } catch (_error) {
      return '';
    }
  }, []);
  const token = useMemo(() => {
    const routeToken = route.params?.token?.trim();

    if (routeToken) {
      return routeToken;
    }

    return fallbackTokenFromUrl;
  }, [fallbackTokenFromUrl, route.params?.token]);
  const isVerifying = loadingAction === 'verifyEmail';
  const isAuthenticated = authState.type === 'AUTHENTICATED';

  useEffect(() => {
    clearError();

    if (!token) {
      return;
    }

    void verifyEmail(token);
  }, [attempt, clearError, token, verifyEmail]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  }, [isAuthenticated, navigation]);

  if (!token) {
    return (
      <ScreenContainer scroll={false} contentStyle={styles.container}>
        <View style={[styles.card, styles.centerCard]}>
          <Text style={styles.title}>Invalid verification link</Text>
          <Text style={[styles.body, styles.centeredBody]}>
            This verification link is missing its token.
          </Text>
          <PrimaryButton
            label="Back to Sign In"
            onPress={() => {
              setAuthView('LOGIN');
              navigation.replace('AuthEntry');
            }}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} contentStyle={styles.container}>
      <View style={[styles.card, styles.centerCard]}>
        {isVerifying ? <ActivityIndicator color={palette.primary} /> : null}
        <Text style={styles.title}>{isAuthenticated ? 'Email verified' : 'Verifying email...'}</Text>
        <Text style={[styles.body, styles.centeredBody]}>
          {isAuthenticated
            ? 'Your account is verified. Redirecting you into BassTab.'
            : 'Please wait while we verify your email link.'}
        </Text>

        {!isVerifying && !isAuthenticated && errorMessage ? (
          <View style={styles.actions}>
            <Text style={[styles.errorText, styles.centeredBody]}>{errorMessage}</Text>
            <PrimaryButton
              label="Try Again"
              onPress={() => {
                setAttempt((value) => value + 1);
              }}
            />
            <PrimaryButton
              variant="ghost"
              label="Back to Sign In"
              onPress={() => {
                setAuthView('LOGIN');
                navigation.replace('AuthEntry');
              }}
            />
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
