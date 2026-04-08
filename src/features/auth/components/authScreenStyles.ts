import { StyleSheet } from 'react-native';

import { palette } from '../../../constants/colors';
import { brandDisplayFontFamily } from '../../../constants/typography';

export const authScreenStyles = StyleSheet.create({
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
  centerCard: {
    alignItems: 'center',
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
  centeredBody: {
    textAlign: 'center',
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
  passwordFieldWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 52,
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
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
  inlineError: {
    color: palette.danger,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: palette.textMuted,
  },
  errorText: {
    color: palette.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: palette.primary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 13,
    color: palette.textMuted,
    fontWeight: '700',
  },
  actions: {
    gap: 8,
  },
});
