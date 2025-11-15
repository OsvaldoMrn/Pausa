// src/screens/CalendarScreen.js
import React, { useState, useEffect, useMemo } from 'react'; // 1. IMPORTAMOS useMemo
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colors } from '../constants/Colors.js';
import { getAllEntries } from '../db/database.js';
import { useNavigation } from '@react-navigation/native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { getEmotionColor } from '../utils/emotionUtils.js';

// ================================================================
// HELPER 1: (EL QUE FALTABA)
// ================================================================
const getLocalDateString = (dateMs) => {
  const date = new Date(dateMs);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const dateNum = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${dateNum}`;
};

// ================================================================
// HELPER 2: (Tu función, sin cambios)
// ================================================================
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

// ================================================================
// Componente Principal
// ================================================================
export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [currentWeek, setCurrentWeek] = useState([]);
  const navigation = useNavigation();
  const [focusedWeekDate, setFocusedWeekDate] = useState(new Date());

  // 2. CORRECCIÓN DEL BUCLE INFINITO
  // Usamos useMemo para que 'today' solo se calcule una vez
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 3. useEffect (El que te pasé, ahora sí funcionará)
  useEffect(() => {
    
    const loadData = () => {
      const entries = getAllEntries();
      const newMarkedDates = {};
      const entriesMap = new Map();
      
      entries.forEach(entry => {
        // Usamos el helper que sí existe ahora
        const dateStr = getLocalDateString(entry.date);
        const color = getEmotionColor(entry.emotion);
        
        newMarkedDates[dateStr] = {
          selected: true,
          selectedColor: color || Colors.primary,
        };
        
        entriesMap.set(dateStr, entry);
      });
      
      if (newMarkedDates[today]) {
        newMarkedDates[today].selected = true;
      }
      setMarkedDates(newMarkedDates);

      // Esta lógica ahora es segura
      const weekDays = getWeekDays(focusedWeekDate);
      const newCurrentWeek = weekDays.map(day => {
        return {
          ...day,
          entry: entriesMap.get(day.id) || null,
        };
      });
      setCurrentWeek(newCurrentWeek);
    };

    // --- Ejecución ---
    loadData();
    const focusListener = navigation.addListener('focus', loadData);
    return focusListener;
    
  }, [navigation, focusedWeekDate, today]); // Ahora 'today' es estable

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

  // 4. RENDER ITEM (El que te pasé, ahora sí funcionará)
  const renderDayItem = ({ item }) => {
    const entry = item.entry;
    
    const bgColor = entry ? getEmotionColor(entry.emotion) + '40' : Colors.card;
    const emotionText = entry ? entry.emotion : 'Sin registro';
    const textStyle = entry ? styles.dayEmotionText : styles.dayContentPlaceholder;
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EntryDetail', { date: item.id })}
      >
        <View style={[styles.dayRow, { backgroundColor: bgColor }]}>
          <Text style={styles.dayText}>{item.formatted}</Text>
          <Text style={textStyle}>
            {emotionText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
      <SafeAreaWrapper>
        <View style={styles.container}>
          <Text style={styles.title}>Pausa</Text>

          <Calendar
            current={today}
            minDate={'2020-01-01'}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            hideExtraDays={true}
            enableSwipeMonths={true}
            theme={{ /* ... */ }}
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

// 5. ESTILOS (Los que te pasé)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  calendar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  listContainer: {
    flex: 1,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  arrowButton: {
    padding: 8,
  },
  arrowText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  dayRow: { 
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 80,
    justifyContent: 'center', 
  },
  dayText: { 
    fontSize: 16,
    color: Colors.textDark,
    fontWeight: '500',
    marginBottom: 6,
  },
  dayContentPlaceholder: { 
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  dayEmotionText: { 
    fontSize: 15,
    color: Colors.text,
    fontWeight: 'bold',
  }
});