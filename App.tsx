import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { BassTabProvider } from './src/store/BassTabProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BassTabProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </BassTabProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
