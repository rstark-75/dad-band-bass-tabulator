import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { palette } from '../../../constants/colors';
import { brandDisplayFontFamily } from '../../../constants/typography';
import { useAuth } from '../state/useAuth';
import { isValidEmail } from '../utils/email';

export function SignInScreen() {
  const {
    draftEmail,
    errorMessage,
    loadingAction,
    startAuth,
    clearError,
  } = useAuth();
  const [email, setEmail] = useState(draftEmail);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const canSubmit = isValidEmail(normalizedEmail);
  const isSubmitting = loadingAction === 'startAuth';

  useEffect(() => {
    setEmail(draftEmail);
  }, [draftEmail]);

  const submit = async () => {
    await startAuth(email);
  };

  return (
    <ScreenContainer scroll={false} contentStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign in to BassTab</Text>
        <Text style={styles.body}>We’ll email you a secure sign-in link.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errorMessage) {
                clearError();
              }
            }}
            onSubmitEditing={() => {
              if (canSubmit && !isSubmitting) {
                void submit();
              }
            }}
            returnKeyType="done"
          />
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <PrimaryButton
          label={isSubmitting ? 'Sending...' : 'Email me a sign-in link'}
          onPress={() => {
            if (!isSubmitting) {
              void submit();
            }
          }}
          disabled={!canSubmit || isSubmitting}
        />
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
    maxWidth: 460,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.text,
    fontFamily: brandDisplayFontFamily,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 16,
    color: palette.textMuted,
    lineHeight: 22,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textMuted,
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    color: palette.text,
    fontSize: 16,
  },
  errorText: {
    color: palette.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
