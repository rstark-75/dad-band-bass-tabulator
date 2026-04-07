import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSubscription } from '../features/subscription';

export function FinalizingUpgradeOverlay() {
  const { finalizingUpgrade, finalizingError, startFinalizingPoll } = useSubscription();

  if (!finalizingUpgrade && !finalizingError) {
    return null;
  }

  const primaryMessage = finalizingError
    ? 'We ran into an issue while finalizing your upgrade.'
    : 'Waiting for Stripe to confirm your upgrade.';

  const secondaryMessage = finalizingError
    ? finalizingError
    : 'Your browser is returning from Stripe now. Sit tight while we sync your Pro entitlement.';

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator style={styles.spinner} size="large" color="#7dd3fc" />
          <Text style={styles.title}>{finalizingError ? 'Upgrade interrupted' : 'Finalising upgrade'}</Text>
          <Text style={styles.message}>{primaryMessage}</Text>
          <Text style={styles.detail}>{secondaryMessage}</Text>
          {finalizingError ? (
            <Pressable
              onPress={startFinalizingPoll}
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            >
              <Text style={styles.retryButtonText}>Check again</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    backgroundColor: '#111827',
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  spinner: {
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  message: {
    fontSize: 14,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  detail: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34d399',
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34d399',
  },
});
