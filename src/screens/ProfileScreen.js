import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';

export default function ProfileScreen() {
  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <Text style={styles.text}>Perfil</Text>
        <Text style={styles.subtext}>(Próximamente: Ajustes)</Text>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  text: { color: Colors.primary, fontSize: 24, fontWeight: 'bold' },
  subtext: { color: Colors.textSecondary, marginTop: 10 },
});