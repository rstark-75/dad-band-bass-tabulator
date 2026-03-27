import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { palette } from '../constants/colors';
import { RootStackParamList } from '../navigation/types';
import { useBassTab } from '../store/BassTabProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportPaste'>;

const defaultTab = `Verse
G|----------------|
D|----------------|
A|7-7-7---5-5-5---|
E|----------------|`;

export function ImportPasteScreen({ navigation }: Props) {
  const { createSong, updateSection } = useBassTab();
  const [title, setTitle] = useState('Pasted Tab Draft');
  const [artist, setArtist] = useState('Unknown Artist');
  const [tabText, setTabText] = useState(defaultTab);

  const handleCreateDraft = () => {
    const song = createSong({ title, artist });
    updateSection(song.id, song.sections[0].id, {
      name: 'Imported Section',
      notes: 'Imported from pasted text. Clean up phrasing and labels as needed.',
      tab: tabText,
    });

    navigation.replace('SongEditor', { songId: song.id });
  };

  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>Paste Tab Text</Text>
        <Text style={styles.subtitle}>
          Drop in copied tab, then turn it into an editable draft chart.
        </Text>

        <Field label="Song Title" value={title} onChangeText={setTitle} />
        <Field label="Artist" value={artist} onChangeText={setArtist} />

        <View style={styles.field}>
          <Text style={styles.label}>Tab Text</Text>
          <TextInput
            value={tabText}
            onChangeText={setTabText}
            multiline
            textAlignVertical="top"
            style={styles.tabInput}
          />
        </View>

        <PrimaryButton label="Create Draft Song" onPress={handleCreateDraft} />
      </View>
    </ScreenContainer>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}

function Field({ label, value, onChangeText }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.textMuted,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
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
  tabInput: {
    minHeight: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.text,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
});
