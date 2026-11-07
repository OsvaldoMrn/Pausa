import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';
import { getDailyReminder, saveDailyReminder } from '../db/database';
import { cancelDailyReminder, scheduleDailyReminder } from '../utils/notificationUtils';

const getTimeInMilliseconds = date => (
  (date.getHours() * 60 * 60 * 1000) + (date.getMinutes() * 60 * 1000)
);

const getDateFromStoredTime = timeMs => {
  const totalMinutes = Math.floor((timeMs % (24 * 60 * 60 * 1000)) / (60 * 1000));
  return new Date(2000, 0, 1, Math.floor(totalMinutes / 60), totalMinutes % 60);
};

export default function NotificationsScreen() {
  const [reminderTime, setReminderTime] = useState(new Date(2000, 0, 1, 20, 0));
  const [isEnabled, setIsEnabled] = useState(false);
  const [notificationId, setNotificationId] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const reminder = getDailyReminder();
      if (reminder) {
        setReminderTime(getDateFromStoredTime(reminder.time_ms));
        setIsEnabled(Boolean(reminder.enabled));
        setNotificationId(reminder.notification_id || null);
      }
    } catch (error) {
      Alert.alert('Error', `No se pudo cargar el recordatorio: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleReminder = async date => {
    const timeMinutes = (date.getHours() * 60) + date.getMinutes();
    const identifier = await scheduleDailyReminder(timeMinutes, notificationId);
    if (!identifier) {
      Alert.alert('Permiso necesario', 'Activa las notificaciones de Pausa en los ajustes de Android para usar este recordatorio.');
      return false;
    }

    const saved = saveDailyReminder(getTimeInMilliseconds(date), true, identifier);
    if (!saved) throw new Error('No se pudo guardar el recordatorio.');

    setNotificationId(identifier);
    setIsEnabled(true);
    return true;
  };

  const handleToggle = async value => {
    setIsLoading(true);
    try {
      if (value) {
        await scheduleReminder(reminderTime);
      } else {
        await cancelDailyReminder(notificationId);
        const saved = saveDailyReminder(getTimeInMilliseconds(reminderTime), false, null);
        if (!saved) throw new Error('No se pudo desactivar el recordatorio.');
        setNotificationId(null);
        setIsEnabled(false);
      }
    } catch (error) {
      Alert.alert('Error', `No se pudo actualizar el recordatorio: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = async (event, selectedDate) => {
    setShowPicker(false);
    if (!selectedDate) return;

    setReminderTime(selectedDate);
    if (!isEnabled) return;

    setIsLoading(true);
    try {
      await scheduleReminder(selectedDate);
    } catch (error) {
      Alert.alert('Error', `No se pudo cambiar la hora: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedTime = reminderTime.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
            <Ionicons name="notifications-outline" size={80} color={Colors.primary} style={{ opacity: 0.8 }} />
        </View>
        
        <Text style={styles.title}>Recordatorio diario</Text>
        
        <Text style={styles.description}>
          Recibe un aviso para hacer una pausa y registrar cómo te sientes.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.label}>Recordatorio</Text>
              <Text style={styles.status}>{isEnabled ? 'Activado' : 'Desactivado'}</Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              disabled={isLoading}
              trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
              thumbColor={isEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>

          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowPicker(true)}
            disabled={isLoading}
          >
            <Ionicons name="time-outline" size={24} color={Colors.primary} />
            <Text style={styles.timeText}>{formattedTime}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={reminderTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {isLoading && <ActivityIndicator color={Colors.primary} style={styles.loader} />}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 30,
    backgroundColor: Colors.background 
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 100,
    backgroundColor: Colors.card,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: Colors.text, 
    marginBottom: 10 
  },
  description: { 
    fontSize: 16, 
    color: Colors.textSecondary, 
    textAlign: 'center', 
    lineHeight: 24,
    marginBottom: 30
  },
  card: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: { flex: 1 },
  label: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  status: { color: Colors.textSecondary, marginTop: 4 },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 18,
    paddingTop: 18,
  },
  timeText: {
    flex: 1,
    color: Colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  loader: { marginTop: 20 },
});