import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { palette } from '../constants/colors';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
  size?: 'default' | 'compact';
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  style,
  variant = 'primary',
  size = 'default',
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'compact' && styles.buttonCompact,
        variantStyles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          size === 'compact' && styles.labelCompact,
          labelStyles[variant],
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonCompact: {
    minHeight: 36,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  labelCompact: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: palette.primary,
  },
  secondary: {
    backgroundColor: palette.primaryMuted,
  },
  ghost: {
    backgroundColor: palette.surfaceMuted,
  },
  danger: {
    backgroundColor: '#fee2e2',
  },
});

const labelStyles = StyleSheet.create({
  primary: {
    color: '#f8fafc',
  },
  secondary: {
    color: palette.primary,
  },
  ghost: {
    color: palette.text,
  },
  danger: {
    color: palette.danger,
  },
});
