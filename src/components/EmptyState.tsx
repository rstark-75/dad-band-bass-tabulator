import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../constants/colors';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 24,
    gap: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
  },
  description: {
    fontSize: 16,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
