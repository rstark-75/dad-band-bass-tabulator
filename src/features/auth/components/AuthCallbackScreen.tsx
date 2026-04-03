import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { palette } from '../../../constants/colors';
import { brandDisplayFontFamily } from '../../../constants/typography';
import { RootStackParamList } from '../../../navigation/types';
import { useAuth } from '../state/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthCallback'>;

export function AuthCallbackScreen({ route, navigation }: Props) {
  const {
    authState,
    errorMessage,
    loadingAction,
    verifyLink,
    clearError,
    useDifferentEmail,
  } = useAuth();
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
  const isVerifying = loadingAction === 'verifyLink';
  const isAuthenticated = authState.type === 'AUTHENTICATED';

  useEffect(() => {
    clearError();

    if (!token) {
      return;
    }

    void verifyLink(token);
  }, [attempt, clearError, token, verifyLink]);

  if (!token) {
    return (
      <ScreenContainer scroll={false} contentStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Invalid sign-in link</Text>
          <Text style={styles.body}>
            This sign-in link is missing information. Please request a new one.
          </Text>
          <PrimaryButton
            label="Back to sign in"
            onPress={() => {
              useDifferentEmail();
              navigation.replace('AuthEntry');
            }}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} contentStyle={styles.container}>
      <View style={styles.card}>
        {isVerifying ? <ActivityIndicator color={palette.primary} /> : null}
        <Text style={styles.title}>{isAuthenticated ? 'Signed in' : 'Signing you in...'}</Text>
        <Text style={styles.body}>
          {isAuthenticated
            ? 'You are now signed in.'
            : 'Please wait while we verify your secure sign-in link.'}
        </Text>

        {!isVerifying && !isAuthenticated && errorMessage ? (
          <>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <PrimaryButton
              label="Try link again"
              onPress={() => {
                setAttempt((value) => value + 1);
              }}
            />
            <PrimaryButton
              variant="ghost"
              label="Back to sign in"
              onPress={() => {
                useDifferentEmail();
                navigation.replace('AuthEntry');
              }}
            />
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 22,
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.text,
    fontFamily: brandDisplayFontFamily,
  },
  body: {
    fontSize: 15,
    color: palette.textMuted,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    color: palette.danger,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
