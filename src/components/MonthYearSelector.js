import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const MONTHS_ES = [
    'Ene', 'Feb', 'Mar', 
    'Abr', 'May', 'Jun', 
    'Jul', 'Ago', 'Sep', 
    'Oct', 'Nov', 'Dic'
];

export default function MonthYearSelector({ selectedMonths = [], selectedYear, onMonthToggle, onYearChange }) {
    const handleYearChange = (offset) => {
        const newYear = selectedYear + offset;
        onYearChange(newYear);
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => handleYearChange(-1)} style={styles.arrowButton}>
                    <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                </TouchableOpacity>

                <Text style={styles.yearText}>{selectedYear}</Text>
                
                <TouchableOpacity onPress={() => handleYearChange(1)} style={styles.arrowButton}>
                    <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                {MONTHS_ES.map((monthName, index) => {
                    const monthNumber = index + 1;
                    const isSelected = selectedMonths.includes(monthNumber);
                    
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.monthButton,
                                isSelected && styles.monthButtonSelected,
                                !isSelected && { backgroundColor: Colors.card } 
                            ]}
                            onPress={() => onMonthToggle(monthNumber)}
                        >
                            <Text style={[
                                styles.monthText,
                                isSelected && styles.monthTextSelected,
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
        backgroundColor: Colors.card, 
        borderRadius: 16,
        padding: 15,
        elevation: 2, 
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width:0, height:2}
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
        color: Colors.textLight,
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
        width: '30%', 
        aspectRatio: 1.8, 
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: Colors.border, 
    },
    monthButtonSelected: {
        backgroundColor: Colors.primary, 
        borderColor: Colors.primary,
    },
    monthText: {
        fontSize: 14,
        fontWeight: '600',
    },
    monthTextSelected: {
        color: '#FFFFFF', 
        fontWeight: 'bold',
    },
});