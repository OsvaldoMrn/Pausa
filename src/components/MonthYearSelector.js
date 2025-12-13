// src/components/MonthYearSelector.js
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const MONTHS_ES = [
    'Ene', 'Feb', 'Mar', 
    'Abr', 'May', 'Jun', 
    'Jul', 'Ago', 'Sep', 
    'Oct', 'Nov', 'Dic'
];

// Recibe el mes y año seleccionados y los setters como props
export default function MonthYearSelector({ initialMonth, initialYear, onMonthChange, onYearChange }) {
    
    const [currentYear, setCurrentYear] = useState(initialYear);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(initialMonth - 1); // 0-11

    // Sincronizar el estado interno con las props iniciales (solo al cargar)
    useState(() => {
        setSelectedMonthIndex(initialMonth - 1);
        setCurrentYear(initialYear);
    }, [initialMonth, initialYear]);
    
    // Handler para cambiar el mes
    const handleMonthPress = useCallback((index) => {
        setSelectedMonthIndex(index);
        onMonthChange(index + 1); // Devuelve el mes 1-12
    }, [onMonthChange]);

    // Handler para cambiar el año
    const handleYearChange = useCallback((offset) => {
        const newYear = currentYear + offset;
        setCurrentYear(newYear);
        onYearChange(newYear);
    }, [currentYear, onYearChange]);
    
    // Helper para determinar si el mes actual de la tabla es el mes actual del calendario real
    const isCurrentCalendarMonth = useMemo(() => {
        const today = new Date();
        return currentYear === today.getFullYear() && selectedMonthIndex === today.getMonth();
    }, [currentYear, selectedMonthIndex]);

    return (
        <View style={styles.container}>
            {/* 1. HEADER (Año y Flechas) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => handleYearChange(-1)} style={styles.arrowButton}>
                    <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                </TouchableOpacity>

                <Text style={styles.yearText}>{currentYear}</Text>
                
                <TouchableOpacity onPress={() => handleYearChange(1)} style={styles.arrowButton}>
                    <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* 2. CUERPO (Tabla 3x4 de Meses) */}
            <View style={styles.grid}>
                {MONTHS_ES.map((monthName, index) => {
                    const isSelected = index === selectedMonthIndex;
                    
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.monthButton,
                                isSelected && styles.monthButtonSelected,
                                // Si no es el mes seleccionado, lo dejamos semi-transparente
                                !isSelected && { backgroundColor: Colors.card } 
                            ]}
                            onPress={() => handleMonthPress(index)}
                        >
                            <Text style={[
                                styles.monthText,
                                isSelected && styles.monthTextSelected,
                                // Si no es el mes seleccionado, usamos color de texto normal
                                !isSelected && { color: Colors.text }
                            ]}>
                                {monthName}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        backgroundColor: Colors.card, // Usamos el color de tarjeta para el fondo
        borderRadius: 16,
        padding: 15,
        // Eliminamos la sombra aquí, ya la pone el padre (DashboardScreen.js)
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    yearText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textLight, // Usamos color claro para el año
    },
    arrowButton: {
        padding: 5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    monthButton: {
        width: '30%', // Tres columnas
        aspectRatio: 1.5, // Más ancho que alto
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 5,
    },
    monthButtonSelected: {
        backgroundColor: Colors.primary, // Color de resaltado
    },
    monthText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    monthTextSelected: {
        color: Colors.textLight,
    },
});