// 1. IMPORTANTE: Esta línea DEBE ser la primera de todo el archivo
import 'react-native-gesture-handler';

import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
// 2. Importamos el "motor" de gestos
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function App() {
  return (
    // 3. Envolvemos toda la app (el Navegador) con el RootView
    <GestureHandlerRootView style={styles.container}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

// 4. Añadimos este estilo para que el RootView ocupe todo
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});