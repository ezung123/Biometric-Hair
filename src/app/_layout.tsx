import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/context/ThemeContext';

if (typeof window !== 'undefined') {
  const origError = console.error;
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('TensorFlow Lite XNNPACK') || msg.includes('GL Driver Message')) {
      return;
    }
    origError(...args);
  };
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
            <Slot />
          </View>
        </NavigationThemeProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

