import { StyleSheet, Text, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { palette } from '../constants/colors';
import { RootStackParamList, TabParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Import'>,
  NativeStackScreenProps<RootStackParamList>
>;

const importOptions = [
  {
    key: 'image',
    title: 'Import From Image',
    description: 'Stub flow for camera roll photos or snapshots of handwritten charts.',
  },
  {
    key: 'pdf',
    title: 'Import From PDF',
    description: 'Stub flow for charts exported from desktop or sent by bandmates.',
  },
  {
    key: 'paste',
    title: 'Paste Tab Text',
    description: 'Turn copied tab into a draft song you can edit straight away.',
  },
] as const;

export function ImportScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Import</Text>
        <Text style={styles.subtitle}>
          Start with an existing chart, then clean it up inside BassTab.
        </Text>
      </View>

      {importOptions.map((option) => (
        <View key={option.key} style={styles.card}>
          <View style={styles.copyBlock}>
            <Text style={styles.cardTitle}>{option.title}</Text>
            <Text style={styles.cardDescription}>{option.description}</Text>
          </View>

          <PrimaryButton
            label={option.key === 'paste' ? 'Paste Tab' : 'Open Flow'}
            onPress={() =>
              option.key === 'paste'
                ? navigation.navigate('ImportPaste')
                : navigation.navigate('ImportDetail', {
                    type: option.key as 'image' | 'pdf',
                  })
            }
          />
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.textMuted,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 16,
  },
  copyBlock: {
    gap: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.text,
  },
  cardDescription: {
    fontSize: 16,
    color: palette.textMuted,
    lineHeight: 22,
  },
});
