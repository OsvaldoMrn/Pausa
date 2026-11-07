import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';
import { getBackupSnapshot, replaceDatabaseFromBackup, saveDailyReminder } from '../db/database';
import { buildBackupPayload, parseAndValidateBackup, serializeBackup } from '../utils/backupUtils';
import { scheduleDailyReminder } from '../utils/notificationUtils';

const APP_VERSION = '1.2.0';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

  const handleCreateBackup = async () => {
    setIsProcessingBackup(true);
    try {
      const snapshot = getBackupSnapshot();
      const backup = buildBackupPayload(snapshot, APP_VERSION);
      const datePart = new Date().toISOString().slice(0, 10);
      const fileUri = `${FileSystem.cacheDirectory}pausa-backup-${datePart}.json`;

      await FileSystem.writeAsStringAsync(fileUri, serializeBackup(backup), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Guardar respaldo de Pausa',
      });
    } catch (error) {
      Alert.alert('Error', `No se pudo crear el respaldo: ${error.message}`);
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const confirmImport = () => new Promise(resolve => {
    Alert.alert(
      'Reemplazar datos',
      'La importación reemplazará los datos actuales de Pausa. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Importar', style: 'destructive', onPress: () => resolve(true) },
      ]
    );
  });

  const handleImportBackup = async () => {
    setIsProcessingBackup(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const backup = parseAndValidateBackup(content);
      const confirmed = await confirmImport();
      if (!confirmed) return;

      const imported = replaceDatabaseFromBackup(backup);
      if (!imported) {
        throw new Error('La base de datos no pudo ser reemplazada.');
      }

      let reminderMessage = '';
      if (backup.notificationSettings?.enabled) {
        const newNotificationId = await scheduleDailyReminder(backup.notificationSettings.timeMinutes);
        if (newNotificationId) {
          const reminderSaved = saveDailyReminder(
            backup.notificationSettings.timeMinutes * 60 * 1000,
            true,
            newNotificationId
          );
          if (!reminderSaved) throw new Error('Los datos se importaron, pero no se pudo guardar el recordatorio.');
        } else {
          reminderMessage = ' El recordatorio no se activó porque no se concedió permiso para notificaciones.';
        }
      }

      Alert.alert('Importación completa', `Tus datos de Pausa fueron restaurados correctamente.${reminderMessage}`);
    } catch (error) {
      Alert.alert('Error', `No se pudo importar el respaldo: ${error.message}`);
    } finally {
      setIsProcessingBackup(false);
    }
  };

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

        {isProcessingBackup && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Procesando respaldo...</Text>
          </View>
        )}

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
            icon="cloud-upload-outline" 
            title="Crear respaldo" 
            subtitle="Guarda todas tus entradas en un archivo JSON"
            color={Colors.primary}
            onPress={handleCreateBackup}
          />
          <MenuItem 
            icon="cloud-download-outline" 
            title="Importar respaldo" 
            subtitle="Restaura tus datos desde un archivo de Pausa"
            color={Colors.primary}
            onPress={handleImportBackup}
          />
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
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  loadingText: { color: Colors.textSecondary, marginLeft: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: 15, borderRadius: 16, marginBottom: 15 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  menuSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});