import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../../../components/PrimaryButton';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { palette } from '../../../constants/colors';
import { brandDisplayFontFamily } from '../../../constants/typography';
import { useAuth } from '../state/useAuth';
import { avatarPresetValue, avatarPresets, findAvatarPreset } from '../utils/avatarPresets';
import { isValidEmail } from '../utils/email';
import { isValidUserId } from '../utils/userId';
import { AuthIntent } from '../state/authTypes';

export function SignInScreen() {
  const {
    draftUserId,
    draftEmail,
    draftAvatarUrl,
    draftIntent,
    errorMessage,
    loadingAction,
    startAuth,
    clearError,
  } = useAuth();
  const [intent, setIntent] = useState<AuthIntent>(draftIntent);
  const [userId, setUserId] = useState(draftUserId);
  const [email, setEmail] = useState(draftEmail);
  const [avatarUrl, setAvatarUrl] = useState(draftAvatarUrl);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const normalizedUserId = useMemo(() => userId.trim().toLowerCase(), [userId]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const normalizedAvatarUrl = useMemo(() => avatarUrl.trim(), [avatarUrl]);
  const selectedPreset = useMemo(
    () => findAvatarPreset(normalizedAvatarUrl),
    [normalizedAvatarUrl],
  );
  const avatarInitial = useMemo(
    () => normalizedUserId.slice(0, 1).toUpperCase() || 'B',
    [normalizedUserId],
  );
  const showAvatarImage =
    !selectedPreset &&
    (normalizedAvatarUrl.startsWith('http://') || normalizedAvatarUrl.startsWith('https://'));
  const emailIsValid = isValidEmail(normalizedEmail);
  const hasAvatarInput = normalizedAvatarUrl.length > 0;
  const avatarIsValid = !hasAvatarInput || Boolean(selectedPreset) || showAvatarImage;
  const showEmailError =
    intent === 'REGISTER' &&
    (submitAttempted || normalizedEmail.length > 0) &&
    !emailIsValid;
  const showAvatarFormatError =
    intent === 'REGISTER' &&
    hasAvatarInput &&
    !avatarIsValid;
  const userIdIsValid = isValidUserId(normalizedUserId);
  const showUserIdError =
    (submitAttempted || normalizedUserId.length > 0) &&
    !userIdIsValid;
  const canSubmit =
    userIdIsValid &&
    (intent === 'LOGIN' || (emailIsValid && avatarIsValid));
  const isSubmitting = loadingAction === 'startAuth';

  useEffect(() => {
    setIntent(draftIntent);
    setUserId(draftUserId);
    setEmail(draftEmail);
    setAvatarUrl(draftAvatarUrl);
    setAvatarLoadFailed(false);
    setSubmitAttempted(false);
  }, [draftAvatarUrl, draftEmail, draftIntent, draftUserId]);

  const submit = async () => {
    setSubmitAttempted(true);

    if (!canSubmit || isSubmitting) {
      return;
    }

    await startAuth({
      rawUserId: userId,
      rawEmail: intent === 'REGISTER' ? email : undefined,
      rawAvatarUrl: avatarUrl,
      intent,
    });
  };

  return (
    <ScreenContainer scroll={false} contentStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{intent === 'REGISTER' ? 'Register for BassTab' : 'Sign in to BassTab'}</Text>
        <Text style={styles.body}>
          {intent === 'REGISTER'
            ? 'Pick your user ID, add an optional avatar, and we’ll link it to your email.'
            : 'Sign in with your user ID. We will use the linked email on your account.'}
        </Text>

        <View style={styles.modeSwitchRow}>
          <Text style={styles.modeSwitchText}>
            {intent === 'REGISTER' ? 'Already have an account?' : 'New here?'}
          </Text>
          <PrimaryButton
            label={intent === 'REGISTER' ? 'Back to Sign In' : 'Create Account'}
            variant="ghost"
            size="compact"
            onPress={() => {
              setIntent(intent === 'REGISTER' ? 'LOGIN' : 'REGISTER');
              setSubmitAttempted(false);
              if (errorMessage) {
                clearError();
              }
            }}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>User ID</Text>
          <TextInput
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            placeholder="your_bass_name"
            placeholderTextColor="#94a3b8"
            style={[styles.input, showUserIdError && styles.inputError]}
            value={userId}
            onChangeText={(value) => {
              setUserId(value);
              if (errorMessage) {
                clearError();
              }
            }}
            onSubmitEditing={() => {
              void submit();
            }}
            returnKeyType={intent === 'REGISTER' ? 'next' : 'done'}
          />
          {showUserIdError ? (
            <Text style={styles.inlineError}>
              Use 3-24 lowercase letters, numbers, or underscores.
            </Text>
          ) : (
            <Text style={styles.hint}>3-24 chars, lowercase letters, numbers, underscores.</Text>
          )}
        </View>

        {intent === 'REGISTER' ? (
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              style={[styles.input, showEmailError && styles.inputError]}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errorMessage) {
                  clearError();
                }
              }}
              onSubmitEditing={() => {
                void submit();
              }}
              returnKeyType="next"
            />
            {showEmailError ? (
              <Text style={styles.inlineError}>Enter a valid email address.</Text>
            ) : null}
          </View>
        ) : null}

        {intent === 'REGISTER' ? (
          <View style={styles.field}>
            <Text style={styles.label}>Avatar</Text>
            <View
              style={[
                styles.avatarCard,
                showAvatarFormatError && styles.avatarCardError,
              ]}
            >
              <View style={styles.avatarPreviewWrap}>
                {showAvatarImage && !avatarLoadFailed ? (
                  <Image
                    source={{ uri: normalizedAvatarUrl }}
                    style={styles.avatarImage}
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : selectedPreset ? (
                  <View
                    style={[
                      styles.avatarFallback,
                      {
                        backgroundColor: selectedPreset.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarPresetGlyph,
                        {
                          color: selectedPreset.textColor,
                        },
                      ]}
                    >
                      {selectedPreset.glyph}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{avatarInitial}</Text>
                  </View>
                )}
              </View>
              <View style={styles.avatarCopy}>
                <Text style={styles.avatarTitle}>Profile Avatar</Text>
                <Text style={styles.avatarHint}>
                  URL preview is live. Direct upload coming soon.
                </Text>
              </View>
            </View>
            <Text style={styles.label}>Pick a preset</Text>
            <View style={styles.presetRow}>
              {avatarPresets.map((preset) => {
                const isSelected = selectedPreset?.id === preset.id;

                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => {
                      setAvatarUrl(avatarPresetValue(preset.id));
                      setAvatarLoadFailed(false);
                      if (errorMessage) {
                        clearError();
                      }
                    }}
                    style={[
                      styles.presetOption,
                      isSelected && styles.presetOptionSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.presetBubble,
                        { backgroundColor: preset.background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetGlyph,
                          { color: preset.textColor },
                        ]}
                      >
                        {preset.glyph}
                      </Text>
                    </View>
                    <Text style={styles.presetLabel} numberOfLines={1}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.label}>Avatar URL (optional)</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://..."
              placeholderTextColor="#94a3b8"
              style={[styles.input, showAvatarFormatError && styles.inputError]}
              value={avatarUrl}
              onChangeText={(value) => {
                setAvatarUrl(value);
                setAvatarLoadFailed(false);
                if (errorMessage) {
                  clearError();
                }
              }}
              onSubmitEditing={() => {
                void submit();
              }}
              returnKeyType="done"
            />
            <PrimaryButton
              label="Clear Avatar"
              variant="ghost"
              size="compact"
              onPress={() => {
                setAvatarUrl('');
                setAvatarLoadFailed(false);
                if (errorMessage) {
                  clearError();
                }
              }}
            />
            {showAvatarFormatError ? (
              <Text style={styles.inlineError}>Use a preset or full `http(s)` image URL.</Text>
            ) : null}
          </View>
        ) : null}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <PrimaryButton
          label={
            isSubmitting
              ? 'Sending...'
              : intent === 'REGISTER'
                ? 'Register with Email Link'
                : 'Sign In with Email Link'
          }
          onPress={() => {
            void submit();
          }}
          disabled={isSubmitting}
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
  modeSwitchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeSwitchText: {
    fontSize: 13,
    color: palette.textMuted,
    fontWeight: '700',
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
  inputError: {
    borderColor: palette.danger,
    backgroundColor: '#fef2f2',
  },
  avatarCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCardError: {
    borderColor: palette.danger,
    backgroundColor: '#fef2f2',
  },
  avatarPreviewWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#e2e8f0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cbd5e1',
  },
  avatarFallbackText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  avatarCopy: {
    flex: 1,
    gap: 2,
  },
  avatarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  avatarHint: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.textMuted,
  },
  avatarPresetGlyph: {
    fontSize: 24,
    lineHeight: 28,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetOption: {
    width: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 4,
    paddingVertical: 6,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  presetOptionSelected: {
    borderColor: palette.primary,
    backgroundColor: '#eff6ff',
  },
  presetBubble: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetGlyph: {
    fontSize: 14,
    lineHeight: 18,
  },
  presetLabel: {
    fontSize: 10,
    lineHeight: 12,
    color: palette.text,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: palette.textMuted,
  },
  inlineError: {
    color: palette.danger,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  errorText: {
    color: palette.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
