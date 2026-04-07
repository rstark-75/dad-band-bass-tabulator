import { Component, PropsWithChildren } from 'react';
import type { ErrorInfo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../constants/colors';

interface SongEditorErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  info?: ErrorInfo;
}

export class SongEditorErrorBoundary extends Component<PropsWithChildren, SongEditorErrorBoundaryState> {
  readonly state: SongEditorErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): SongEditorErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ hasError: true, error, info });
    console.error('[SongEditor] error boundary caught', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children ?? null;
    }

    const message = this.state.error?.message ?? 'Unknown error';
    const stack = this.state.info?.componentStack ?? 'No stack available';

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong in Song Editor.</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.stackLabel}>Component stack</Text>
        <Text style={styles.stack}>{stack}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  message: {
    fontSize: 14,
    color: palette.textMuted,
  },
  stackLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: palette.textMuted,
  },
  stack: {
    fontSize: 11,
    color: palette.text,
    fontFamily: 'monospace',
  },
});
