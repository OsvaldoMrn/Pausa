// src/screens/CalendarScreen.js
import React, { useState, useEffect } from 'react';
// 1. Importamos TouchableOpacity para los botones
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colors } from '../constants/Colors.js';
import { getAllEntries } from '../db/database.js';
import { useNavigation } from '@react-navigation/native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

// ... (emotionColors no cambia)
const emotionColors = {
  feliz: Colors.emotionHappy,
  triste: Colors.emotionSad,
  enojado: Colors.emotionAngry,
  calmado: Colors.emotionCalm,
  ansioso: Colors.emotionAnxious,
};

// ... (getWeekDays no cambia, ¡ya era dinámico!)
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
        const dayString = day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
        const formatted = dayString.charAt(0).toUpperCase() + dayString.slice(1);
        const year = day.getFullYear();
        const month = (day.getMonth()+1).toString().padStart(2, '0');
        const dateNum = day.getDate().toString().padStart(2, '0')
        const toLocaleDateString = `${year}-${month}-${dateNum}`
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
    const today = new Date().toISOString().split('T')[0];

    // 2. NUEVO ESTADO para la navegación semanal
    const [focusedWeekDate, setFocusedWeekDate] = useState(new Date());

    const loadMarkedDates = () => {
        // ... (sin cambios)
        const entries = getAllEntries();
        const marked = {};
        entries.forEach(entry => {
            const dateStr = new Date(entry.date).toISOString().split('T')[0];
            const emotionKey = entry.emotion.toLowerCase();
            marked[dateStr] = {
                selected: true,
                selectedColor: emotionColors[emotionKey] || Colors.primary,
            };
        });
        if (marked[today]) {
            marked[today].selected = true;
        }
        setMarkedDates(marked);
    };

    // 3. useEffect ahora reacciona a 'focusedWeekDate'
    useEffect(() => {
        loadMarkedDates();

        // Genera la semana basado en la fecha "enfocada"
        const weekDays = getWeekDays(focusedWeekDate);
        setCurrentWeek(weekDays);

        const focusListener = navigation.addListener('focus', () => {
            loadMarkedDates();
            // Cuando volvemos, reseteamos a la semana actual
            const todayDate = new Date();
            setFocusedWeekDate(todayDate);
            const updatedWeek = getWeekDays(todayDate);
            setCurrentWeek(updatedWeek);
        });

        return focusListener;
        // Escuchamos a navigation Y a la fecha enfocada
    }, [navigation, focusedWeekDate]);

    const handleDayPress = (day) => {
        navigation.navigate('EntryDetail', { date: day.dateString });
    };

    // 4. NUEVAS FUNCIONES para mover la semana
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

    // 5. RENDER ITEM - Actualizado con placeholder
    const renderDayItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('EntryDetail', { date: item.id })}
        >
            <View style={styles.dayRow}>
                <Text style={styles.dayText}>{item.formatted}</Text>
                <Text style={styles.dayContentPlaceholder}>
                    Aquí irá el resumen de la emoción...
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        // Asumimos que aquí ya está el 'bottom' en edges
        <SafeAreaWrapper>
            <View style={styles.container}>
                <Text style={styles.title}>Pausa</Text>

                <Calendar
                    // ... (props del calendario sin cambios)
                    current={today}
                    minDate={'2020-01-01'}
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    hideExtraDays={true}
                    enableSwipeMonths={true}
                    theme={{ /* ... (theme sin cambios) */ }}
                    style={styles.calendar}
                />

                <View style={styles.listContainer}>
                    {/* 6. NUEVO HEADER para la lista */}
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

// ================================================================
// Estilos Actualizados
// ================================================================
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

    // 7. NUEVOS ESTILOS para el header de la lista
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
        padding: 8, // Área de toque más grande
    },
    arrowText: {
        fontSize: 18,
        color: Colors.primary,
        fontWeight: 'bold',
    },

    // 8. ESTILOS DE FILA ACTUALIZADOS
    dayRow: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.card,
        minHeight: 80, // <-- (PUNTO 2) Altura mínima
    },
    dayText: {
        fontSize: 16,
        color: Colors.textDark,
        fontWeight: '500',
        marginBottom: 6, // <-- (PUNTO 2) Separación
    },
    dayContentPlaceholder: { // <-- (PUNTO 2) Placeholder
        fontSize: 14,
        color: Colors.textMuted,
        fontStyle: 'italic',
    }
});