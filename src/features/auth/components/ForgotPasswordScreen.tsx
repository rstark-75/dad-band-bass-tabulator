import { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useAuth } from '../state/useAuth';
import { isValidEmail } from '../utils/email';
import { authScreenStyles as styles } from './authScreenStyles';

export function ForgotPasswordScreen() {
  const {
    draftEmail,
    errorMessage,
    infoMessage,
    loadingAction,
    forgotPassword,
    setAuthView,
    clearError,
    clearInfo,
  } = useAuth();
  const [email, setEmail] = useState(draftEmail);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailIsValid = isValidEmail(normalizedEmail);
  const showEmailError = (submitAttempted || normalizedEmail.length > 0) && !emailIsValid;
  const isSubmitting = loadingAction === 'forgotPassword';

  const submit = async () => {
    setSubmitAttempted(true);

    if (isSubmitting || !emailIsValid) {
      return;
    }

    await forgotPassword({ rawEmail: email });
  };

  return (
    <ScreenContainer scroll={false} contentStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.body}>
          Enter your email address and we'll send a reset link if the account exists.
        </Text>

        {infoMessage ? <Text style={styles.successText}>{infoMessage}</Text> : null}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            style={[styles.input, showEmailError && styles.inputError]}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errorMessage) {
                clearError();
              }
              if (infoMessage) {
                clearInfo();
              }
            }}
            onSubmitEditing={() => {
              void submit();
            }}
            returnKeyType="done"
          />
          {showEmailError ? <Text style={styles.inlineError}>Enter a valid email address.</Text> : null}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.actions}>
          <PrimaryButton
            label={isSubmitting ? 'Sending reset link...' : 'Send Reset Link'}
            onPress={() => {
              void submit();
            }}
            disabled={isSubmitting}
          />
          <PrimaryButton
            variant="ghost"
            label="Back to Sign In"
            onPress={() => {
              clearError();
              clearInfo();
              setAuthView('LOGIN');
            }}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
