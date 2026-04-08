import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { palette } from '../../../constants/colors';
import { RootStackParamList } from '../../../navigation/types';
import { useAuth } from '../state/useAuth';
import { authScreenStyles as styles } from './authScreenStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props) {
  const { errorMessage, loadingAction, resetPassword, clearError, setAuthView } = useAuth();
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
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
  const passwordIsValid = password.length >= 8 && password.length <= 128;
  const showPasswordError = (submitAttempted || password.length > 0) && !passwordIsValid;
  const isSubmitting = loadingAction === 'resetPassword';

  const submit = async () => {
    setSubmitAttempted(true);

    if (isSubmitting || !passwordIsValid) {
      return;
    }

    const success = await resetPassword({ token, rawNewPassword: password });

    if (!success) {
      return;
    }

    setResetComplete(true);
  };

  if (!token) {
    return (
      <ScreenContainer scroll={false} contentStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Invalid reset link</Text>
          <Text style={styles.body}>
            This reset link is missing its token.
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
      <View style={styles.card}>
        <Text style={styles.title}>Choose a new password</Text>
        <Text style={styles.body}>
          Set a new password for your account.
        </Text>

        {resetComplete ? (
          <>
            <Text style={styles.successText}>Your password has been reset. You can sign in now.</Text>
            <PrimaryButton
              label="Back to Sign In"
              onPress={() => {
                setAuthView('LOGIN');
                navigation.replace('AuthEntry');
              }}
            />
          </>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>New password</Text>
              <View style={styles.passwordFieldWrap}>
                <TextInput
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!passwordVisible}
                  textContentType="newPassword"
                  autoComplete="password-new"
                  placeholder="newSecret123"
                  placeholderTextColor="#94a3b8"
                  style={[
                    styles.input,
                    styles.passwordInput,
                    showPasswordError && styles.inputError,
                  ]}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (errorMessage) {
                      clearError();
                    }
                  }}
                  onSubmitEditing={() => {
                    void submit();
                  }}
                  returnKeyType="done"
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => {
                    setPasswordVisible((value) => !value);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={palette.textMuted}
                  />
                </Pressable>
              </View>
              {showPasswordError ? (
                <Text style={styles.inlineError}>Password must be 8-128 characters.</Text>
              ) : null}
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.actions}>
              <PrimaryButton
                label={isSubmitting ? 'Resetting password...' : 'Reset Password'}
                onPress={() => {
                  void submit();
                }}
                disabled={isSubmitting}
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
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
