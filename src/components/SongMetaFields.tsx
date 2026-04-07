import { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { palette } from '../constants/colors';
import { tuningOptions } from '../constants/tunings';
import { Song } from '../types/models';

interface SongMetaFieldsProps {
  song: Song;
  onFieldChange: <K extends keyof Song>(field: K, value: Song[K]) => void;
  compact?: boolean;
  lockMetadata?: boolean;
  stringCountOptions?: number[];
}

const StringCountSelector = ({
  value,
  options,
  onSelect,
  disabled,
}: {
  value: number;
  options: number[];
  onSelect: (value: number) => void;
  disabled?: boolean;
}) => (
  <View style={[styles.stringCountSelector, disabled && styles.selectorDisabled]}>
    {(options.length > 0 ? options : [4, 5]).map((option) => (
      <Pressable
        key={option}
        disabled={disabled}
        onPress={() => onSelect(option)}
        style={({ pressed }) => [
          styles.stringCountPill,
          option === value && styles.stringCountPillActive,
          pressed && !disabled && styles.stringCountPillPressed,
        ]}
      >
        <Text
          style={[
            styles.stringCountPillText,
            option === value && styles.stringCountPillTextActive,
          ]}
        >
          {option}
        </Text>
      </Pressable>
    ))}
  </View>
);

export function SongMetaFields({
  song,
  onFieldChange,
  compact = false,
  lockMetadata = false,
  stringCountOptions,
}: SongMetaFieldsProps) {
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      {!compact ? <Text style={styles.title}>Song Details</Text> : null}

      <View style={styles.grid}>
        <View style={[styles.row, compact && styles.rowCompact]}>
          <Field
            label="Title"
            value={song.title}
            onChangeText={(value) => onFieldChange('title', value)}
            style={[styles.titleField, compact && styles.titleFieldCompact]}
            inputStyle={styles.titleArtistInput}
            disabled={lockMetadata}
          />
          <Field
            label="Artist"
            value={song.artist}
            onChangeText={(value) => onFieldChange('artist', value)}
            style={[styles.artistField, compact && styles.artistFieldCompact]}
            inputStyle={styles.titleArtistInput}
            disabled={lockMetadata}
          />
          <View
            style={[
              styles.field,
              compact && styles.compactField,
              styles.stringField,
            ]}
          >
            <Text style={[styles.label, lockMetadata && styles.labelDisabled]}>Strings</Text>
            <StringCountSelector
              value={song.stringCount}
              options={stringCountOptions ?? [4, 5]}
              onSelect={(value) => onFieldChange('stringCount', value)}
              disabled={lockMetadata}
            />
          </View>
        </View>
        <View style={[styles.row, compact && styles.rowCompact]}>
          <Field
            label="Key"
            value={song.key}
            onChangeText={(value) => onFieldChange('key', value)}
            compact
            style={[styles.keyField, compact && styles.keyFieldCompact]}
            disabled={lockMetadata}
          />
          <Field
            label="Tuning"
            value={song.tuning}
            onChangeText={(value) => onFieldChange('tuning', value)}
            options={tuningOptions as unknown as string[]}
            style={[styles.tuningField, compact && styles.tuningFieldCompact]}
            inputStyle={styles.tuningInput}
            disabled={lockMetadata}
          />
        </View>
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
  inputStyle?: StyleProp<TextStyle>;
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
  inputStyle,
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
        style={[styles.input, disabled && styles.inputDisabled, inputStyle]}
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
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    width: '100%',
    alignItems: 'flex-start',
  },
  rowCompact: {
    gap: 5,
    flexWrap: 'nowrap',
    alignItems: 'flex-end',
  },
  field: {
    gap: 5,
    flex: 1,
    minWidth: 100,
  },
  compactField: {
    gap: 3,
    minWidth: 0,
  },
  titleField: {
    flexGrow: 2,
    minWidth: 120,
  },
  artistField: {
    flexGrow: 2,
    minWidth: 120,
  },
  titleFieldCompact: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  artistFieldCompact: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  keyFieldCompact: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    width: 52,
  },
  keyField: {
    flexBasis: 100,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 80,
  },
  tuningFieldCompact: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    width: 80,
  },
  tuningField: {
    flexBasis: 110,
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 80,
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
    minHeight: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: palette.text,
    fontSize: 13,
  },
  tuningInput: {},
  titleArtistInput: {},
  inputDisabled: {
    backgroundColor: '#e5e7eb',
    borderColor: '#cbd5e1',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectValue: {
    flex: 1,
    color: palette.text,
    fontSize: 13,
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
  stringField: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    width: 'auto',
  },
  stringCountSelector: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  stringCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: palette.surfaceMuted,
    minWidth: 32,
    alignItems: 'center',
  },
  stringCountPillActive: {
    backgroundColor: palette.primary,
  },
  stringCountPillPressed: {
    opacity: 0.75,
  },
  stringCountPillText: {
    color: palette.text,
    fontWeight: '600',
  },
  stringCountPillTextActive: {
    color: '#f8fafc',
  },
  selectorDisabled: {
    opacity: 0.4,
  },
});
