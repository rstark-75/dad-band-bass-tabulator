import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { palette } from '../../../constants/colors';
import { RootStackParamList } from '../../../navigation/types';
import { isValidEmail } from '../utils/email';
import { useAuth } from '../state/useAuth';
import { authScreenStyles as styles } from './authScreenStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ route, navigation }: Props) {
  const { authState, errorMessage, infoMessage, loadingAction, verifyEmail, resendVerification, clearError, setAuthView } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [verifyErrorCode, setVerifyErrorCode] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [showResend, setShowResend] = useState(false);
  // Tracks which token+attempt combination we've already dispatched to the API,
  // preventing double-calls from Strict Mode double-invoke or deep link re-open.
  const verifyCallKeyRef = useRef('');

  const resendEmailIsValid = isValidEmail(resendEmail.trim().toLowerCase());
  const isResending = loadingAction === 'resendVerification';

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
    return routeToken || fallbackTokenFromUrl;
  }, [fallbackTokenFromUrl, route.params?.token]);

  const isVerifying = loadingAction === 'verifyEmail';
  const isAuthenticated = authState.type === 'AUTHENTICATED';
  const alreadyConsumed = verifyErrorCode === 'TOKEN_ALREADY_CONSUMED';

  useEffect(() => {
    clearError();
    setVerifyErrorCode(null);
    setShowResend(false);

    if (!token) {
      return;
    }

    const callKey = `${token}-${attempt}`;
    if (verifyCallKeyRef.current === callKey) {
      return;
    }
    verifyCallKeyRef.current = callKey;

    void verifyEmail(token).then((result) => {
      if (result?.errorCode) {
        setVerifyErrorCode(result.errorCode);
      }
    });
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
      <ScreenContainer contentStyle={styles.container}>
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
    <ScreenContainer contentStyle={styles.container}>
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

            {alreadyConsumed ? (
              <PrimaryButton
                label="Sign In"
                onPress={() => {
                  setAuthView('LOGIN');
                  navigation.replace('AuthEntry');
                }}
              />
            ) : (
              <>
                <PrimaryButton
                  label="Try Again"
                  onPress={() => {
                    setAttempt((value) => value + 1);
                  }}
                />
                <PrimaryButton
                  variant="ghost"
                  label="Send me a new link"
                  onPress={() => {
                    clearError();
                    setShowResend(true);
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
              </>
            )}
          </View>
        ) : null}

        {showResend && !isAuthenticated ? (
          <View style={styles.actions}>
            {infoMessage ? (
              <Text style={[styles.successText, styles.centeredBody]}>{infoMessage}</Text>
            ) : (
              <>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  placeholder="your@email.com"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={resendEmail}
                  onChangeText={setResendEmail}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (resendEmailIsValid) {
                      void resendVerification({ rawEmail: resendEmail });
                    }
                  }}
                />
                <PrimaryButton
                  label={isResending ? 'Sending...' : 'Send verification email'}
                  onPress={() => {
                    void resendVerification({ rawEmail: resendEmail });
                  }}
                  disabled={isResending || !resendEmailIsValid}
                />
              </>
            )}
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
