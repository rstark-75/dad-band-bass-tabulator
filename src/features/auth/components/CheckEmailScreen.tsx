import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { palette } from '../../../constants/colors';
import { brandDisplayFontFamily } from '../../../constants/typography';
import { useAuth } from '../state/useAuth';
import { sanitizeCode } from '../utils/codeInput';

const getSecondsUntil = (isoDate?: string | null): number => {
  if (!isoDate) {
    return 0;
  }

  const target = Date.parse(isoDate);

  if (Number.isNaN(target)) {
    return 0;
  }

  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
};

export function CheckEmailScreen() {
  const {
    authState,
    loadingAction,
    errorMessage,
    clearError,
    verifyCode,
    resendAuth,
    useDifferentEmail,
  } = useAuth();
  const checkEmailState = authState.type === 'CHECK_EMAIL' ? authState : null;
  const [code, setCode] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(
    getSecondsUntil(checkEmailState?.nextAllowedResendAt),
  );

  useEffect(() => {
    setCode('');
    setSecondsRemaining(getSecondsUntil(checkEmailState?.nextAllowedResendAt));
  }, [checkEmailState?.email, checkEmailState?.nextAllowedResendAt]);

  useEffect(() => {
    if (!checkEmailState?.nextAllowedResendAt) {
      setSecondsRemaining(0);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(getSecondsUntil(checkEmailState.nextAllowedResendAt));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [checkEmailState?.nextAllowedResendAt]);

  const cleanedCode = useMemo(() => sanitizeCode(code), [code]);
  const canVerify = cleanedCode.length === 6;
  const isVerifying = loadingAction === 'verifyCode';
  const isResending = loadingAction === 'resendAuth';
  const canResend = secondsRemaining <= 0 && !isResending;

  if (!checkEmailState) {
    return null;
  }

  const submitCode = async () => {
    await verifyCode(checkEmailState.email, cleanedCode);
  };

  return (
    <ScreenContainer scroll={false} contentStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>
          We sent a sign-in link and a backup code to {checkEmailState.maskedEmail}.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>6-digit backup code</Text>
          <TextInput
            autoFocus
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            placeholder="123456"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={cleanedCode}
            onChangeText={(value) => {
              setCode(sanitizeCode(value));
              if (errorMessage) {
                clearError();
              }
            }}
            maxLength={6}
            onSubmitEditing={() => {
              if (canVerify && !isVerifying) {
                void submitCode();
              }
            }}
            returnKeyType="done"
          />
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <PrimaryButton
          label={isVerifying ? 'Verifying...' : 'Verify code'}
          onPress={() => {
            if (!isVerifying) {
              void submitCode();
            }
          }}
          disabled={!canVerify || isVerifying}
        />

        <View style={styles.secondaryActions}>
          <PrimaryButton
            variant="secondary"
            label={
              canResend
                ? isResending
                  ? 'Sending...'
                  : 'Resend email'
                : `Resend in ${secondsRemaining}s`
            }
            onPress={() => {
              if (canResend) {
                void resendAuth();
              }
            }}
            disabled={!canResend}
          />
          <PrimaryButton
            variant="ghost"
            label="Use a different email"
            onPress={useDifferentEmail}
          />
        </View>
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
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  secondaryActions: {
    gap: 8,
  },
  errorText: {
    color: palette.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
