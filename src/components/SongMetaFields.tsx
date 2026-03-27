import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '../constants/colors';
import { feelStyleSuggestions } from '../constants/feelStyles';
import { tuningOptions } from '../constants/tunings';
import { Song } from '../types/models';

interface SongMetaFieldsProps {
  song: Song;
  onFieldChange: <K extends keyof Song>(field: K, value: Song[K]) => void;
}

export function SongMetaFields({ song, onFieldChange }: SongMetaFieldsProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Song Details</Text>

      <View style={styles.grid}>
        <Field
          label="Title"
          value={song.title}
          onChangeText={(value) => onFieldChange('title', value)}
        />
        <Field
          label="Artist"
          value={song.artist}
          onChangeText={(value) => onFieldChange('artist', value)}
        />
        <Field
          label="Key"
          value={song.key}
          onChangeText={(value) => onFieldChange('key', value)}
          compact
        />
        <Field
          label="Feel / Style"
          value={song.feelNote}
          onChangeText={(value) => onFieldChange('feelNote', value)}
          suggestions={feelStyleSuggestions as unknown as string[]}
        />
        <Field
          label="Tuning"
          value={song.tuning}
          onChangeText={(value) => onFieldChange('tuning', value)}
          options={tuningOptions as unknown as string[]}
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
  suggestions?: string[];
}

function Field({
  label,
  value,
  onChangeText,
  compact = false,
  keyboardType = 'default',
  options,
  suggestions,
}: FieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (options) {
    return (
      <View style={[styles.field, compact && styles.compactField, styles.dropdownField]}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          onPress={() => setIsOpen((current) => !current)}
          style={({ pressed }) => [
            styles.input,
            styles.selectTrigger,
            pressed && styles.pressed,
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
                  onChangeText(option);
                  setIsOpen(false);
                }}
                style={({ pressed }) => [
                  styles.dropdownOption,
                  option === value && styles.dropdownOptionActive,
                  pressed && styles.pressed,
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
    <View style={[styles.field, compact && styles.compactField]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor={palette.textMuted}
      />
      {suggestions?.length ? (
        <View style={styles.suggestionRow}>
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => onChangeText(suggestion)}
              style={({ pressed }) => [
                styles.suggestionChip,
                value === suggestion && styles.suggestionChipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.suggestionChipText,
                  value === suggestion && styles.suggestionChipTextActive,
                ]}
              >
                {suggestion}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
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
  dropdownField: {
    zIndex: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textMuted,
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
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  suggestionChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: palette.surfaceMuted,
  },
  suggestionChipActive: {
    backgroundColor: palette.primaryMuted,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textMuted,
  },
  suggestionChipTextActive: {
    color: palette.primary,
  },
});
