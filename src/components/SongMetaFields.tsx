import { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';

import { palette } from '../constants/colors';
import { tuningOptions } from '../constants/tunings';
import { Song } from '../types/models';

interface SongMetaFieldsProps {
  song: Song;
  onFieldChange: <K extends keyof Song>(field: K, value: Song[K]) => void;
  compact?: boolean;
  lockMetadata?: boolean;
}

export function SongMetaFields({
  song,
  onFieldChange,
  compact = false,
  lockMetadata = false,
}: SongMetaFieldsProps) {
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      {!compact ? <Text style={styles.title}>Song Details</Text> : null}

      <View style={styles.grid}>
        <Field
          label="Title"
          value={song.title}
          onChangeText={(value) => onFieldChange('title', value)}
          style={compact ? styles.titleFieldCompact : undefined}
          disabled={lockMetadata}
        />
        <Field
          label="Artist"
          value={song.artist}
          onChangeText={(value) => onFieldChange('artist', value)}
          style={compact ? styles.artistFieldCompact : undefined}
          disabled={lockMetadata}
        />
        <Field
          label="Key"
          value={song.key}
          onChangeText={(value) => onFieldChange('key', value)}
          compact
          style={compact ? styles.keyFieldCompact : undefined}
          disabled={lockMetadata}
        />
        <Field
          label="Tuning"
          value={song.tuning}
          onChangeText={(value) => onFieldChange('tuning', value)}
          options={tuningOptions as unknown as string[]}
          style={compact ? styles.tuningFieldCompact : undefined}
          disabled={lockMetadata}
        />
      </View>
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  compact?: boolean;
  keyboardType?: 'default' | 'numeric';
  options?: string[];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

function Field({
  label,
  value,
  onChangeText,
  compact = false,
  keyboardType = 'default',
  options,
  style,
  disabled = false,
}: FieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (options) {
    return (
      <View style={[styles.field, compact && styles.compactField, styles.dropdownField, style]}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
        <Pressable
          onPress={() => {
            if (disabled) {
              return;
            }

            setIsOpen((current) => !current);
          }}
          style={({ pressed }) => [
            styles.input,
            styles.selectTrigger,
            pressed && !disabled && styles.pressed,
            disabled && styles.inputDisabled,
          ]}
        >
          <Text style={styles.selectValue}>{value}</Text>
          <Text style={styles.selectChevron}>{isOpen ? '▲' : '▼'}</Text>
        </Pressable>

        {isOpen ? (
          <View style={styles.dropdownMenu}>
            {options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    if (disabled) {
                      return;
                    }

                    onChangeText(option);
                    setIsOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.dropdownOption,
                    option === value && styles.dropdownOptionActive,
                    pressed && !disabled && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      option === value && styles.dropdownOptionTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      );
    }

  return (
    <View style={[styles.field, compact && styles.compactField, style]}>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={[styles.input, disabled && styles.inputDisabled]}
        placeholderTextColor={palette.textMuted}
        editable={!disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'flex-start',
  },
  compactCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderRadius: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  field: {
    gap: 5,
    width: 220,
    maxWidth: '100%',
  },
  compactField: {
    width: 120,
  },
  titleFieldCompact: {
    width: '35%',
    flexGrow: 0,
  },
  artistFieldCompact: {
    width: '35%',
    flexGrow: 0,
  },
  keyFieldCompact: {
    width: 72,
    flexGrow: 0,
    flexShrink: 0,
  },
  tuningFieldCompact: {
    width: '20%',
    flexGrow: 0,
  },
  dropdownField: {
    zIndex: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textMuted,
  },
  labelDisabled: {
    opacity: 0.65,
  },
  input: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: palette.text,
    fontSize: 15,
  },
  inputDisabled: {
    backgroundColor: '#e5e7eb',
    borderColor: '#cbd5e1',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectValue: {
    flex: 1,
    color: palette.text,
    fontSize: 15,
  },
  selectChevron: {
    fontSize: 12,
    color: palette.textMuted,
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.surface,
  },
  dropdownOptionActive: {
    backgroundColor: palette.primaryMuted,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: palette.text,
  },
  dropdownOptionTextActive: {
    color: palette.primary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
