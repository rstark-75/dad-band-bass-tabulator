import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../../../components/ScreenContainer';
import { palette } from '../../../constants/colors';
import { brandDisplayFontFamily } from '../../../constants/typography';

export function AuthRestoringScreen() {
  return (
    <ScreenContainer scroll={false} contentStyle={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator color={palette.primary} size="small" />
        <Text style={styles.title}>Opening BassTab...</Text>
        <Text style={styles.subtitle}>Checking your session.</Text>
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
    maxWidth: 420,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 24,
    gap: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: palette.text,
    fontFamily: brandDisplayFontFamily,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    color: palette.textMuted,
  },
});
