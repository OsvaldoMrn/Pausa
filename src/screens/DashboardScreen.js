import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';
import WeeklyDonutChart from '../components/WeeklyDonutChart';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getEntriesForDay, getEmotionFrequency } from '../db/database';
import { getEmotionColor } from '../utils/emotionUtils';
import MonthYearSelector from '../components/MonthYearSelector';

const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Helper para obtener el string de fecha YYYY-MM-DD
const getDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper para obtener la emoción dominante del día
// Usamos la emoción con la intensidad MÁS ALTA como dominante
const getDominantEmotion = (entries) => {
    if (!entries || entries.length === 0) return null;

    let maxIntensity = -1;
    let dominantEmotion = null;

    for (const entry of entries) {
        if (entry.intensity > maxIntensity) {
            maxIntensity = entry.intensity;
            dominantEmotion = entry.emotion;
        }
    }
    return dominantEmotion;
};

const DAYS_ES_ORDER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
/**
 * Convierte el índice de día de JS (0=Dom, 1=Lun) a nuestro índice de visualización (0=Lun, 6=Dom).
 */
const getDisplayIndex = (jsDayIndex) => {
    // Si es Domingo (0), su índice de visualización es 6.
    // Si no es Domingo, su índice de visualización es el de JS - 1.
    return jsDayIndex === 0 ? 6 : jsDayIndex - 1;
};

const processFrequencyData = (data) => {
    if (!data || data.length === 0) {
        return {
            totalEntries: 0,
            top3Frequency: [],
            highestAvgIntensity: null,
        }
    }

    //1. Total de entradas
    const totalEntries = data.reduce((sum, item) => sum + item.count, 0)

    //2. top 3 frecuencia (que ya viene ordenada desde la query)
    const top3Frequency = data.slice(0, 3).map(item => ({
        emotion: item.emotion,
        count: item.count,
        color: getEmotionColor(item.emotion),
    }))

    //3. emocion de maxima intensidad promedio
    let maxIntensityEmotion = null;
    let maxIntensity = -1;

    data.forEach(item => {
        if (item.count >= 3 && item.avg_intensity > maxIntensity) {
            maxIntensity = item.avg_intensity;
            maxIntensityEmotion = {
                emotion: item.emotion,
                intensity: parseFloat(item.avg_intensity).toFixed(1),
                color: getEmotionColor(item.emotion),
            }
        }
    })

    return {
        totalEntries,
        top3Frequency,
        highestAvgIntensity: maxIntensityEmotion,
    }
}

export default function DashboardScreen() {
    const navigation = useNavigation();
    const [weeklyData, setWeeklyData] = useState([]);
    const [periodMetrics, setPeriodMetrics] = useState(null);

    // ESTADO NUEVO: Array de meses seleccionados (por defecto el actual)
    const [selectedMonths, setSelectedMonths] = useState([new Date().getMonth() + 1]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // --- LÓGICA DE TOGGLE ---
    const handleMonthToggle = (monthNumber) => {
        setSelectedMonths(prev => {
            if (prev.includes(monthNumber)) {
                // Si ya está, lo quitamos (filtro)
                return prev.filter(m => m !== monthNumber);
            } else {
                // Si no está, lo agregamos
                // Ordenamos (.sort) para que el array siempre sea [1, 5, 12] y no [5, 1, 12]
                return [...prev, monthNumber].sort((a, b) => a - b);
            }
        });
    };

    // Función de carga y procesamiento de la data semanal (Últimos 7 días)
    const loadWeeklyData = useCallback(async () => {
        const today = new Date();
        const data = [];

        // --- 1. ENCONTRAR EL LUNES DE ESTA SEMANA ---
        // El día de la semana de JS es 0 (Dom) a 6 (Sáb).
        // Queremos el Lunes (día JS 1). Si hoy es Domingo (0), queremos retroceder 6 días.
        // Si hoy es Martes (2), queremos retroceder 1 día.
        const dayOfWeek = today.getDay(); // 0 (Dom) a 6 (Sáb)
        // Calculamos cuántos días retroceder para llegar al Lunes (1)
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const monday = new Date(today);
        monday.setDate(today.getDate() - diffToMonday); // Ahora `monday` es el Lunes de esta semana

        // --- 2. RECOLECTAR LA DATA DE LUNES A DOMINGO ---
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i); // Lunes + 0, Lunes + 1, etc.

            const dateString = getDateString(date);
            const dayOfWeekIndex = date.getDay(); // 0=Dom, 1=Lun, ...
            const displayIndex = getDisplayIndex(dayOfWeekIndex); // 0=Lun, 1=Mar, ...

            const entries = getEntriesForDay(dateString);
            const dominantEmotionName = getDominantEmotion(entries);
            const dominantEmotionColor = dominantEmotionName
                ? getEmotionColor(dominantEmotionName)
                : Colors.border;

            // Almacenamos la data directamente en el orden Lunes a Domingo (por el loop)
            data.push({
                dayLabel: DAYS_ES_ORDER[displayIndex],
                dateString: dateString,
                color: dominantEmotionColor,
                hasEntry: !!dominantEmotionName,
            });
        }

        // Ya no necesitamos ordenar, el loop garantiza el orden Lunes -> Domingo
        setWeeklyData(data);
    }, []);

    // --- loadPeriodMetrics: VERSIÓN AGREGADA (LA MAGIA) ---
    const loadPeriodMetrics = useCallback(async () => {
        if (selectedMonths.length === 0) {
            setPeriodMetrics(null);
            return;
        }

        // Mapa temporal para fusionar resultados: { "Ira": { count: 10, intensitySum: 85 } }
        const aggregationMap = new Map();

        // 1. ITERAR SOBRE CADA MES SELECCIONADO
        for (const month of selectedMonths) {
            const year = selectedYear;
            // Inicio del mes
            const startDate = new Date(year, month - 1, 1).getTime();
            // Fin del mes
            const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

            // Consultar BD para ESTE mes
            const monthData = getEmotionFrequency(startDate, endDate);

            // 2. FUSIONAR EN EL MAPA
            monthData.forEach(item => {
                if (!aggregationMap.has(item.emotion)) {
                    aggregationMap.set(item.emotion, { count: 0, intensitySum: 0 });
                }
                const current = aggregationMap.get(item.emotion);
                current.count += item.count;
                // Para promediar correctamente después, sumamos (promedio * cantidad)
                current.intensitySum += (item.avg_intensity * item.count);
            });
        }

        // 3. RECONSTRUIR EL ARRAY FINAL
        const aggregatedData = Array.from(aggregationMap.entries()).map(([emotion, data]) => ({
            emotion: emotion,
            count: data.count,
            // Recuperamos el promedio total: suma total de intensidades / conteo total
            avg_intensity: data.intensitySum / data.count
        }));

        // 4. ORDENAR POR FRECUENCIA (DESC) para que processFrequencyData funcione bien
        aggregatedData.sort((a, b) => b.count - a.count);

        const metrics = processFrequencyData(aggregatedData);
        setPeriodMetrics(metrics);

    }, [selectedMonths, selectedYear]);

    // Se carga la data al montar la pantalla y cada vez que vuelve al foco
    useFocusEffect(
        useCallback(() => {
            loadWeeklyData();
            loadPeriodMetrics();
        }, [loadWeeklyData, loadPeriodMetrics])
    );

    // Handler para navegar a EntryDetailScreen
    const handleSegmentPress = (dateString) => {
        navigation.navigate('EntryDetail', { date: dateString });
    };

    // Helper para mostrar título de meses seleccionados
    const getSelectedMonthsLabel = () => {
        if (selectedMonths.length === 0) return "Ningún mes seleccionado";
        if (selectedMonths.length === 12) return "Todo el Año";
        // Mapea los números a nombres cortos (Ene, Feb...)
        return selectedMonths.map(m => MONTHS_ES[m - 1].substring(0, 3)).join(", ");
    };

    return (
        <SafeAreaWrapper>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Dashboard</Text>

                {/* --- SECCIÓN 1: ROSCA SEMANAL --- */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Resumen Últimos 7 Días</Text>

                    {weeklyData.length === 7 ? (
                        <WeeklyDonutChart
                            data={weeklyData}
                            totalDays={7}
                            loggedDays={weeklyData.filter(d => d.hasEntry).length}
                        />
                    ) : (
                        <View style={styles.chartPlaceholder}><Text style={styles.placeholderText}>Cargando datos...</Text></View>
                    )}

                    {/* Botones de Navegación por Día */}
                    <View style={styles.dailyNavContainer}>
                        {weeklyData.map((dayData, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleSegmentPress(dayData.dateString)}
                                disabled={!dayData.hasEntry}
                                style={[
                                    styles.dailyButton,
                                    { backgroundColor: dayData.color, opacity: dayData.hasEntry ? 1 : 0.4 }
                                ]}
                            >
                                <Text style={styles.dailyButtonText}>{dayData.dayLabel}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.cardSubtitle}>
                        Toca el día para ver la entrada.
                    </Text>
                </View>

                {/* --- SECCIÓN 2: PATRONES NARRATIVOS (Placeholder) --- */}
                <Text style={styles.sectionHeader}>Patrones por Día de la Semana</Text>
                <View style={styles.card}>
                    <Text style={styles.placeholderText}>
                        Aquí irá la lógica de "Los Lunes sientes más estrés..."
                    </Text>
                    <View style={{ height: 80 }} />
                </View>

                {/* --- SECCIÓN 3: RESUMEN DINÁMICO --- */}
                <Text style={styles.sectionHeader}>Análisis de Período</Text>

                <View style={styles.card}>

                    {/* SELECTOR MÚLTIPLE */}
                    <MonthYearSelector
                        selectedMonths={selectedMonths} // Pasamos el array
                        selectedYear={selectedYear}
                        onMonthToggle={handleMonthToggle} // Pasamos el toggle
                        onYearChange={setSelectedYear}
                    />

                    {/* MÉTRICAS */}
                    {periodMetrics && periodMetrics.totalEntries > 0 ? (
                        <View>
                            <Text style={styles.metricTitle}>
                                Análisis de: {getSelectedMonthsLabel()} del {selectedYear}
                            </Text>
                            <Text style={[styles.metricTitle, { fontSize: 14, marginTop: 5 }]}>
                                Total Entradas: <Text style={styles.metricValue}>{periodMetrics.totalEntries}</Text>
                            </Text>

                            <View style={styles.divider} />

                            {/* Top 3 */}
                            <Text style={styles.metricSubtitle}>Emociones Más Frecuentes:</Text>
                            {periodMetrics.top3Frequency.map((item, index) => (
                                <View key={index} style={styles.topMetricRow}>
                                    <Text style={styles.topMetricRank}>{index + 1}.</Text>
                                    <View style={[styles.colorChip, { backgroundColor: item.color }]} />
                                    <Text style={styles.topMetricText}>{item.emotion}</Text>
                                    <Text style={styles.topMetricCount}>({item.count})</Text>
                                </View>
                            ))}
                            <View style={styles.divider} />

                            {/* Intensidad */}
                            {periodMetrics.highestAvgIntensity ? (
                                <View>
                                    <Text style={styles.metricSubtitle}>Pico Emocional Promedio (Mínimo 3):</Text>
                                    <View style={styles.maxIntensityRow}>
                                        <Text style={styles.maxIntensityText}>
                                            <Text style={[styles.maxIntensityEmotion, { color: periodMetrics.highestAvgIntensity.color }]}>
                                                {" "}{periodMetrics.highestAvgIntensity.emotion}{" "}
                                            </Text>
                                            intensidad de
                                            <Text style={styles.maxIntensityValue}>
                                                {" "}{periodMetrics.highestAvgIntensity.intensity}/10
                                            </Text>
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.placeholderText}>
                                    Faltan datos para identificar pico emocional.
                                </Text>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.placeholderText}>
                            {selectedMonths.length === 0
                                ? "Selecciona al menos un mes arriba."
                                : `No hay registros en los meses seleccionados de ${selectedYear}.`}
                        </Text>
                    )}
                    <View style={{ height: 20 }} />

                    <Text style={styles.placeholderText}>Aquí irá el gráfico de barras</Text>
                </View>
            </ScrollView>
        </SafeAreaWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 50,
    },
    title: {
        color: Colors.text,
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20
    },

    // Estilos de Tarjeta (Reutilizando el look moderno)
    card: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 15,
        marginBottom: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 10,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },

    // Estilos de secciones
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        marginBottom: 10,
        marginLeft: 5,
    },
    placeholderText: {
        color: Colors.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 10,
    },

    // grafico de pastel
    chartPlaceholder: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dailyNavContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        marginBottom: 10,
    },
    dailyButton: {
        flex: 1,
        marginHorizontal: 2,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dailyButtonText: {
        color: Colors.textLight,
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 15,
    },

    // --- Estilos de Picker (Unificados) ---
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    pickerInput: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        color: Colors.text,
        paddingRight: 30,
        backgroundColor: Colors.inputBg,
        marginHorizontal: 5,
        // CLAVE: Ajustar el FLEX para Android
        flex: 1,
    },
    pickerLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginLeft: 5,
        fontWeight: 'bold',
    },
    // --- Estilos de Métricas Narrativas ---
    metricTitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        fontWeight: '600',
    },
    metricValue: {
        fontSize: 20,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    metricSubtitle: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    topMetricRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        paddingHorizontal: 5,
    },
    topMetricRank: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        marginRight: 10,
        width: 20,
    },
    colorChip: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    topMetricText: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    topMetricCount: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    maxIntensityRow: {
        marginTop: 5,
        alignItems: 'center',
    },
    maxIntensityText: {
        fontSize: 16,
        color: Colors.text,
        textAlign: 'center',
        lineHeight: 24,
    },
    maxIntensityEmotion: {
        fontWeight: 'bold',
        fontSize: 17,
    },
    maxIntensityValue: {
        fontWeight: 'bold',
        fontSize: 17,
        color: Colors.error, // Usamos el color de Error para darle énfasis
    }
});