import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';

export default function ProfileScreen() {
  const navigation = useNavigation();

  const MenuItem = ({ icon, title, subtitle, onPress, color = Colors.primary }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Ajustes</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>HÁBITOS</Text>
          <MenuItem 
            icon="notifications" 
            title="Notificaciones" 
            subtitle="Programa tus recordatorios diarios"
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DATOS</Text>
          <MenuItem 
            icon="document-text" 
            title="Exportar a PDF" 
            subtitle="Genera un reporte en formato PDF"
            color={Colors.accent}
            onPress={() => navigation.navigate('Export')} // Aquí conectaremos el PDF luego
          />
        </View>

      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 30, textAlign: 'center' },
  section: { marginBottom: 30 },
  sectionHeader: { color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginLeft: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: 15, borderRadius: 16, marginBottom: 15 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  menuSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});