import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'pausa-reminders';

export const requestNotificationPermission = async () => {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios de Pausa',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });

  const currentPermissions = await Notifications.getPermissionsAsync();
  if (currentPermissions.status === 'granted') return true;

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  return requestedPermissions.status === 'granted';
};

export const scheduleDailyReminder = async (timeMinutes, previousNotificationId = null) => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  if (previousNotificationId) {
    await Notifications.cancelScheduledNotificationAsync(previousNotificationId);
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Pausa',
      body: 'Tómate un momento para registrar cómo te sientes.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Math.floor(timeMinutes / 60),
      minute: timeMinutes % 60,
      channelId: CHANNEL_ID,
    },
  });
};

export const cancelDailyReminder = async notificationId => {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
};