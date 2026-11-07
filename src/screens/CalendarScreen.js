import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colors } from '../constants/Colors.js';
import { getAllEntries } from '../db/database.js';
import { useNavigation } from '@react-navigation/native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { getEmotionColor } from '../utils/emotionUtils.js';
import { Ionicons } from '@expo/vector-icons';


const getLocalDateString = (dateMs) => {
  const date = new Date(dateMs);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const dateNum = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${dateNum}`;
};

const getWeekDays = (date) => {
  const today = new Date(date);
  const dayOfWeek = today.getDay();
  const diffToMonday = (dayOfWeek === 0) ? 6 : (dayOfWeek - 1);
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);
  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const dayString = day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const formatted = dayString.charAt(0).toUpperCase() + dayString.slice(1);
    const year = day.getFullYear();
    const month = (day.getMonth() + 1).toString().padStart(2, '0');
    const dateNum = day.getDate().toString().padStart(2, '0');
    const toLocaleDateString = `${year}-${month}-${dateNum}`;
    week.push({
      id: toLocaleDateString,
      formatted: formatted,
    });
  }
  return week;
};

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [currentWeek, setCurrentWeek] = useState([]);
  const navigation = useNavigation();
  const [focusedWeekDate, setFocusedWeekDate] = useState(new Date());

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    const loadData = () => {
      const entries = getAllEntries();

      const newMarkedDates = {};
      const entriesMap = new Map();

      entries.forEach(entry => {
        const dateStr = getLocalDateString(entry.date);

        if (!entriesMap.has(dateStr)) {
          entriesMap.set(dateStr, []);
        }
        entriesMap.get(dateStr).push(entry);
      });

      entriesMap.forEach((dayEntries, dateStr) => {
        const latestEntry = dayEntries[0];
        const color = getEmotionColor(latestEntry.emotion);

        newMarkedDates[dateStr] = {
          selected: true,
          selectedColor: color || Colors.primary,
        };
      });

      if (newMarkedDates[today]) {
        newMarkedDates[today].selected = true;
      }
      setMarkedDates(newMarkedDates);

      const weekDays = getWeekDays(focusedWeekDate);
      const newCurrentWeek = weekDays.map(day => {
        const dayEntries = entriesMap.get(day.id) || [];
        return {
          ...day,
          entries: dayEntries, // Pasamos todas las entradas
        };
      });

      setCurrentWeek(newCurrentWeek);
    };

    loadData();
    const focusListener = navigation.addListener('focus', loadData);
    return focusListener;

  }, [navigation, focusedWeekDate, today]);

  const handleDayPress = (day) => {
    navigation.navigate('EntryDetail', { date: day.dateString });
  };

  const handlePrevWeek = () => {
    setFocusedWeekDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setFocusedWeekDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + 7);
      return newDate;
    });
  };

  const renderDayItem = ({ item }) => {
    const dayEntries = item.entries;
    const hasEntries = dayEntries && dayEntries.length > 0;
    const latestEntry = hasEntries ? dayEntries[0] : null;
    const indicatorColor = latestEntry ? getEmotionColor(latestEntry.emotion) : Colors.border;
    const emotionText = hasEntries ? dayEntries.map(e => e.emotion).reverse().join(', ') : 'Sin registro';

    return (
      <TouchableOpacity onPress={() => navigation.navigate('EntryDetail', { date: item.id })}>
        <View style={styles.cardItem}>
          <View style={[styles.colorIndicator, { backgroundColor: indicatorColor }]} />

          <View style={styles.cardContent}>
            <Text style={styles.dayText}>{item.formatted}</Text>
            <Text style={[styles.entryText, !hasEntries && styles.placeholderText]} numberOfLines={1}>
              {emotionText}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaWrapper edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Pausa</Text>

        <Calendar
          current={today}
          minDate={'2020-01-01'}
          onDayPress={handleDayPress}
          markedDates={markedDates}
          hideExtraDays={true}
          enableSwipeMonths={true}
          theme={{ /* ...Tus estilos del tema... */
            backgroundColor: Colors.background,
            calendarBackground: Colors.background,
            textSectionTitleColor: Colors.textSecondary,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: Colors.primary,
            todayBackgroundColor: 'transparent',
            dayTextColor: Colors.text,
            textDisabledColor: Colors.textSecondary + '50',
            monthTextColor: Colors.primary,
            arrowColor: Colors.primary,
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
          }}
          style={styles.calendar}
        />

        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <TouchableOpacity onPress={handlePrevWeek} style={styles.arrowButton}>
              <Text style={styles.arrowText}>{"<"}</Text>
            </TouchableOpacity>
            <Text style={styles.listTitle}>Resumen Semanal</Text>
            <TouchableOpacity onPress={handleNextWeek} style={styles.arrowButton}>
              <Text style={styles.arrowText}>{">"}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={currentWeek}
            renderItem={renderDayItem}
            keyExtractor={item => item.id}
          />
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', paddingVertical: 20 },
  calendar: { borderTopWidth: 1, borderTopColor: Colors.border },
  listContainer: { flex: 1, paddingHorizontal: 10 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: Colors.backgroundSecondary, marginBottom: 10 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  arrowButton: { padding: 8 },
  arrowText: { fontSize: 18, color: Colors.primary, fontWeight: 'bold' },
  dayRow: { paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, minHeight: 80, justifyContent: 'center' },
  dayText: { fontSize: 16, color: Colors.textDark, fontWeight: '500', marginBottom: 6 },
  dayContentPlaceholder: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  dayEmotionText: { fontSize: 15, color: Colors.text, fontWeight: 'bold' },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    elevation: 2, // Sombra
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  colorIndicator: {
    width: 6,
    height: 40,
    borderRadius: 3,
    marginRight: 15,
  },
  cardContent: { flex: 1 },
  dayText: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 4, textTransform: 'capitalize' },
  entryText: { fontSize: 14, color: Colors.textSecondary },
  placeholderText: { color: Colors.textMuted, fontStyle: 'italic' },
});