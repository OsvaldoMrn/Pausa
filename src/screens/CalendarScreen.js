// src/screens/CalendarScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colors } from '../constants/Colors.js';
import { getAllEntries } from '../db/database.js';
import { useNavigation } from '@react-navigation/native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { getEmotionColor } from '../utils/emotionUtils.js';

// ... (getLocalDateString y getWeekDays se quedan IGUAL, no los borres)
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
      // 1. Obtenemos TODAS las entradas (vienen ordenadas por fecha DESC: la más reciente primero)
      const entries = getAllEntries();
      
      const newMarkedDates = {};
      // 2. El mapa ahora guardará un ARRAY de entradas, no una sola
      const entriesMap = new Map(); 
      
      entries.forEach(entry => {
        const dateStr = getLocalDateString(entry.date);
        
        // --- LÓGICA DE AGRUPACIÓN ---
        if (!entriesMap.has(dateStr)) {
          entriesMap.set(dateStr, []);
        }
        // Añadimos la entrada al array de ese día
        entriesMap.get(dateStr).push(entry);
      });

      // --- LÓGICA DE CALENDARIO (Solo color de la última) ---
      // Iteramos sobre los días que tienen datos
      entriesMap.forEach((dayEntries, dateStr) => {
        // Como getAllEntries devuelve DESC (más reciente primero),
        // la entrada [0] es la ÚLTIMA que registró el usuario.
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

      // --- LÓGICA DE PLAYLIST ---
      const weekDays = getWeekDays(focusedWeekDate);
      const newCurrentWeek = weekDays.map(day => {
        // Obtenemos EL ARRAY de entradas para ese día (o array vacío)
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

  // ... (handlePrevWeek y handleNextWeek siguen igual) ...
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

  // 3. RENDER ITEM ACTUALIZADO
  const renderDayItem = ({ item }) => {
    const dayEntries = item.entries; // Esto es un array
    const hasEntries = dayEntries && dayEntries.length > 0;
    
    // Color de fondo: Usamos la más reciente (índice 0)
    const latestEntry = hasEntries ? dayEntries[0] : null;
    const bgColor = latestEntry ? getEmotionColor(latestEntry.emotion) + '40' : Colors.card;
    
    // Texto: Juntamos TODAS las emociones
    // map crea una lista de nombres, reverse para que salga en orden cronológico (mañana -> noche), join une con comas
    // Nota: dayEntries viene DESC (Noche, Tarde, Mañana). Hacemos reverse para leer natural.
    const emotionText = hasEntries 
      ? dayEntries.map(e => e.emotion).reverse().join(', ') 
      : 'Sin registro';

    const textStyle = hasEntries ? styles.dayEmotionText : styles.dayContentPlaceholder;
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EntryDetail', { date: item.id })}
      >
        <View style={[styles.dayRow, { backgroundColor: bgColor }]}>
          <Text style={styles.dayText}>{item.formatted}</Text>
          <Text style={textStyle} numberOfLines={1} ellipsizeMode="tail">
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

// 4. ESTILOS (Sin cambios importantes, solo numberOfLines en el Text maneja el desborde)
const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', paddingVertical: 20 },
  calendar: { borderTopWidth: 1, borderTopColor: Colors.border },
  listContainer: { flex: 1, marginTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: Colors.backgroundSecondary },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  arrowButton: { padding: 8 },
  arrowText: { fontSize: 18, color: Colors.primary, fontWeight: 'bold' },
  dayRow: { paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, minHeight: 80, justifyContent: 'center' },
  dayText: { fontSize: 16, color: Colors.textDark, fontWeight: '500', marginBottom: 6 },
  dayContentPlaceholder: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  dayEmotionText: { fontSize: 15, color: Colors.text, fontWeight: 'bold' }
});