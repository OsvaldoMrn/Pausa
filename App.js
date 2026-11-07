// App.js
// 1. IMPORTANTE: Esta línea DEBE ser la primera de todo el archivo
import 'react-native-gesture-handler';

import React, { useEffect } from 'react'; // <--- Importamos useEffect
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

// 2. Importamos la función de inicialización
import { initDatabase } from './src/db/database'; 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  
  // 3. Creamos las tablas al iniciar la app
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});