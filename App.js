import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// 1. Importamos tu archivo de colores
// (Asegúrate de que la ruta './src/constants/Colors.js' sea correcta)
import { Colors } from './src/constants/Colors';

export default function App() {
  return (
    // 2. Usamos los colores en los estilos
    <View style={styles.container}>
      <Text style={styles.title}>¡Proyecto Pausa!</Text>
      <Text style={styles.subtitle}>Configuración inicial lista.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

// 3. Creamos los estilos usando tu archivo
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Usamos el color de fondo secundario
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    // Usamos el color primario
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    // Usamos el color de texto secundario
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});