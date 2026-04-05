import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { palette } from '../../../constants/colors';
import { brandDisplayFontFamily } from '../../../constants/typography';
import { useAuth } from '../state/useAuth';
import { sanitizeCode } from '../utils/codeInput';
import { isValidEmail } from '../utils/email';

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
  const [email, setEmail] = useState(checkEmailState?.email ?? '');
  const [secondsRemaining, setSecondsRemaining] = useState(
    getSecondsUntil(checkEmailState?.nextAllowedResendAt),
  );

  useEffect(() => {
    setCode('');
    setEmail(checkEmailState?.email ?? '');
    setSecondsRemaining(getSecondsUntil(checkEmailState?.nextAllowedResendAt));
  }, [checkEmailState?.email, checkEmailState?.nextAllowedResendAt, checkEmailState?.userId]);

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
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const needsEmailInput = (checkEmailState?.email ?? '').trim().length === 0;
  const requiresEmailForVerify =
    (checkEmailState?.mode ?? 'LOGIN') === 'REGISTER' && needsEmailInput;
  const emailIsValid = normalizedEmail.length > 0 && isValidEmail(normalizedEmail);
  const canVerify = cleanedCode.length === 6 && (!requiresEmailForVerify || emailIsValid);
  const isVerifying = loadingAction === 'verifyCode';
  const isResending = loadingAction === 'resendAuth';
  const canResend = secondsRemaining <= 0 && !isResending;

  if (!checkEmailState) {
    return null;
  }

  const isRegisterChallenge = checkEmailState.mode === 'REGISTER';
  const titleText = isRegisterChallenge ? 'Confirm your new account' : 'Check your email';
  const bodyText = isRegisterChallenge
    ? `We sent a registration link and a backup code to ${checkEmailState.maskedEmail}.`
    : `We sent a sign-in link and a backup code to ${checkEmailState.maskedEmail}.`;
  const verifyButtonText = isVerifying
    ? 'Verifying...'
    : isRegisterChallenge
      ? 'Complete registration'
      : 'Verify code';
  const switchAccountText = isRegisterChallenge ? 'Back to Register' : 'Use a different account';

  const submitCode = async () => {
    await verifyCode({
      rawUserId: checkEmailState.userId,
      rawEmail: checkEmailState.email || (emailIsValid ? normalizedEmail : undefined),
      rawCode: cleanedCode,
    });
  };

  return (
    <ScreenContainer scroll={false} contentStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.body}>{bodyText}</Text>
        <Text style={styles.accountMeta}>
          {isRegisterChallenge ? 'Registering' : 'Signing in'} as {checkEmailState.userId}
        </Text>

        {needsEmailInput ? (
          <View style={styles.field}>
            <Text style={styles.label}>Linked email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              style={styles.emailInput}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errorMessage) {
                  clearError();
                }
              }}
              onSubmitEditing={() => {
                if (canVerify && !isVerifying) {
                  void submitCode();
                }
              }}
              returnKeyType="next"
            />
            {(checkEmailState.mode === 'LOGIN' && !emailIsValid && normalizedEmail.length > 0) ? (
              <Text style={styles.helperText}>Use a valid linked email format.</Text>
            ) : null}
          </View>
        ) : null}

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
          label={verifyButtonText}
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
            label={switchAccountText}
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
  accountMeta: {
    fontSize: 13,
    color: palette.primary,
    fontWeight: '700',
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
  emailInput: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    color: palette.text,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.textMuted,
    fontWeight: '600',
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
