import * as Notifications from 'expo-notifications';

export const requestNotificationPermission = async () => {
  const currentPermissions = await Notifications.getPermissionsAsync();
  const permissions = currentPermissions.status === 'granted'
    ? currentPermissions
    : await Notifications.requestPermissionsAsync();

  if (permissions.status !== 'granted') return false;

  return true;
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
      body: '¿Cómo ha estado tu día?',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Math.floor(timeMinutes / 60),
      minute: timeMinutes % 60,
    },
  });
};

export const cancelDailyReminder = async notificationId => {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
};