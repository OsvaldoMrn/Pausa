import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';
import WeeklyDonutChart from '../components/WeeklyDonutChart';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getEntriesForDay, getEmotionFrequency, getHistoricalEntriesByWeekday } from '../db/database';
import { getEmotionColor } from '../utils/emotionUtils';
import { buildWeekdayPattern } from '../utils/weekdayPatternUtils';
import MonthYearSelector from '../components/MonthYearSelector';
import EmotionBarChart from '../components/EmotionBarChart';

const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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
const DAYS_ES_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const getWeekSelectorDays = () => {
    const today = new Date();
    const diffToMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return {
            weekday: date.getDay(),
            label: DAYS_ES_ORDER[index],
        };
    });
};
const getDisplayIndex = (jsDayIndex) => {
    return jsDayIndex === 0 ? 6 : jsDayIndex - 1;
};

const processFrequencyData = (data) => {
    if (!data || data.length === 0) {
        return {
            totalEntries: 0,
            top3Frequency: [],
            highestAvgIntensity: null,
            barChartData: []
        }
    }

    const totalEntries = data.reduce((sum, item) => sum + item.count, 0)

    const top3Frequency = data.slice(0, 3).map(item => ({
        emotion: item.emotion,
        count: item.count,
        color: getEmotionColor(item.emotion),
    }))

    const barChartData = data.slice(3, 8)
        .filter(item => item.count > 0)
        .map(item => ({
            ...item,
            color: getEmotionColor(item.emotion)
        }));

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
        barChartData,
        highestAvgIntensity: maxIntensityEmotion,
    }
}

export default function DashboardScreen() {
    const navigation = useNavigation();
    const [weeklyData, setWeeklyData] = useState([]);
    const [periodMetrics, setPeriodMetrics] = useState(null);
    const [weekdayPatternRange, setWeekdayPatternRange] = useState('recent');
    const [weekdayPattern, setWeekdayPattern] = useState(null);
    const [selectedWeekday, setSelectedWeekday] = useState(() => new Date().getDay());

    const [selectedMonths, setSelectedMonths] = useState([new Date().getMonth() + 1]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const loadWeekdayPattern = useCallback(() => {
        const entries = getHistoricalEntriesByWeekday(selectedWeekday);
        const limit = weekdayPatternRange === 'recent' ? 8 : Infinity;
        setWeekdayPattern(buildWeekdayPattern(entries, limit));
    }, [selectedWeekday, weekdayPatternRange]);

    useEffect(() => {
        loadWeekdayPattern();
    }, [loadWeekdayPattern]);

    const handleMonthToggle = (monthNumber) => {
        setSelectedMonths(prev => {
            if (prev.includes(monthNumber)) {
                return prev.filter(m => m !== monthNumber);
            } else {
                return [...prev, monthNumber].sort((a, b) => a - b);
            }
        });
    };

    const loadWeeklyData = useCallback(async () => {
        const today = new Date();
        const data = [];

        const dayOfWeek = today.getDay(); 
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const monday = new Date(today);
        monday.setDate(today.getDate() - diffToMonday); 

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i); 

            const dateString = getDateString(date);
            const dayOfWeekIndex = date.getDay(); 
            const displayIndex = getDisplayIndex(dayOfWeekIndex); 

            const entries = getEntriesForDay(dateString);
            const dominantEmotionName = getDominantEmotion(entries);
            const dominantEmotionColor = dominantEmotionName
                ? getEmotionColor(dominantEmotionName)
                : Colors.border;

            data.push({
                dayLabel: DAYS_ES_ORDER[displayIndex],
                dateString: dateString,
                color: dominantEmotionColor,
                hasEntry: !!dominantEmotionName,
            });
        }

        setWeeklyData(data);
    }, []);

    const loadPeriodMetrics = useCallback(async () => {
        if (selectedMonths.length === 0) {
            setPeriodMetrics(null);
            return;
        }

        const aggregationMap = new Map();

        for (const month of selectedMonths) {
            const year = selectedYear;
            const startDate = new Date(year, month - 1, 1).getTime();
            const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

            const monthData = getEmotionFrequency(startDate, endDate);

            monthData.forEach(item => {
                if (!aggregationMap.has(item.emotion)) {
                    aggregationMap.set(item.emotion, { count: 0, intensitySum: 0 });
                }
                const current = aggregationMap.get(item.emotion);
                current.count += item.count;
                current.intensitySum += (item.avg_intensity * item.count);
            });
        }

        const aggregatedData = Array.from(aggregationMap.entries()).map(([emotion, data]) => ({
            emotion: emotion,
            count: data.count,
            avg_intensity: data.intensitySum / data.count
        }));

        aggregatedData.sort((a, b) => b.count - a.count);

        const metrics = processFrequencyData(aggregatedData);
        setPeriodMetrics(metrics);

    }, [selectedMonths, selectedYear]);

    useFocusEffect(
        useCallback(() => {
            loadWeeklyData();
            loadPeriodMetrics();
            loadWeekdayPattern();
        }, [loadWeeklyData, loadPeriodMetrics, loadWeekdayPattern])
    );

    const handleSegmentPress = (dateString) => {
        navigation.navigate('EntryDetail', { date: dateString });
    };

    const getSelectedMonthsLabel = () => {
        if (selectedMonths.length === 0) return "Ningún mes seleccionado";
        if (selectedMonths.length === 12) return "Todo el Año";
        return selectedMonths.map(m => MONTHS_ES[m - 1].substring(0, 3)).join(", ");
    };

    return (
        <SafeAreaWrapper edges={['top', 'left', 'right']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Dashboard</Text>

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

                <Text style={styles.sectionHeader}>Patrones por Día de la Semana</Text>
                <View style={styles.card}>
                    <View style={styles.weekdaySelector}>
                        {getWeekSelectorDays().map(day => (
                            <TouchableOpacity
                                key={day.weekday}
                                onPress={() => setSelectedWeekday(day.weekday)}
                                style={[
                                    styles.weekdayButton,
                                    selectedWeekday === day.weekday && styles.weekdayButtonActive,
                                ]}
                            >
                                <Text style={[
                                    styles.weekdayButtonText,
                                    selectedWeekday === day.weekday && styles.weekdayButtonTextActive,
                                ]}>
                                    {day.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.patternRangeContainer}>
                        {[
                            { key: 'recent', label: 'Últimos 8' },
                            { key: 'all', label: 'Todo el tiempo' },
                        ].map(option => (
                            <TouchableOpacity
                                key={option.key}
                                onPress={() => setWeekdayPatternRange(option.key)}
                                style={[
                                    styles.patternRangeButton,
                                    weekdayPatternRange === option.key && styles.patternRangeButtonActive,
                                ]}
                            >
                                <Text style={[
                                    styles.patternRangeText,
                                    weekdayPatternRange === option.key && styles.patternRangeTextActive,
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {weekdayPattern && !weekdayPattern.hasEnoughData ? (
                        <Text style={styles.placeholderText}>
                            Todavía no hay suficientes {DAYS_ES_FULL[selectedWeekday]} registrados para encontrar un patrón.
                        </Text>
                    ) : weekdayPattern?.winner?.isClear ? (
                        <View style={styles.patternResult}>
                            <View style={[styles.patternColor, { backgroundColor: weekdayPattern.winner.color }]} />
                            <Text style={styles.patternText}>
                                Tus {DAYS_ES_FULL[selectedWeekday]} suelen inclinarse hacia{' '}
                                <Text style={styles.patternCategory}>{weekdayPattern.winner.category}</Text>:
                                {' '}apareció en {weekdayPattern.winner.count} de {weekdayPattern.daysAnalyzed} días analizados.
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.placeholderText}>
                            Tus {DAYS_ES_FULL[selectedWeekday]} han sido variados.{' '}
                            {weekdayPattern?.winner
                                ? `${weekdayPattern.winner.category} fue la categoría más frecuente, con ${weekdayPattern.winner.count} de ${weekdayPattern.daysAnalyzed} días, pero sin una diferencia clara.`
                                : 'No hay una categoría claramente dominante.'}
                        </Text>
                    )}
                </View>

                <Text style={styles.sectionHeader}>Análisis de Período</Text>

                <View style={styles.card}>

                    <MonthYearSelector
                        selectedMonths={selectedMonths} 
                        selectedYear={selectedYear}
                        onMonthToggle={handleMonthToggle} 
                        onYearChange={setSelectedYear}
                    />

                    {periodMetrics && periodMetrics.totalEntries > 0 ? (
                        <View>
                            <Text style={styles.metricTitle}>
                                Análisis de: {getSelectedMonthsLabel()} del {selectedYear}
                            </Text>
                            <Text style={[styles.metricTitle, { fontSize: 14, marginTop: 5 }]}>
                                Total Entradas: <Text style={styles.metricValue}>{periodMetrics.totalEntries}</Text>
                            </Text>

                            <View style={styles.divider} />

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
                    {periodMetrics && (
                        <EmotionBarChart data={periodMetrics.barChartData} />
                    )}
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
    weekdaySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    weekdayButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 9,
        marginHorizontal: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    weekdayButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    weekdayButtonText: {
        color: Colors.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    weekdayButtonTextActive: {
        color: Colors.textDark,
    },
    patternRangeContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.inputBg,
        borderRadius: 10,
        padding: 3,
        marginBottom: 15,
    },
    patternRangeButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 9,
        borderRadius: 8,
    },
    patternRangeButtonActive: {
        backgroundColor: Colors.primary,
    },
    patternRangeText: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    patternRangeTextActive: {
        color: Colors.textDark,
    },
    patternResult: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    patternColor: {
        width: 10,
        height: 42,
        borderRadius: 5,
        marginRight: 12,
    },
    patternText: {
        flex: 1,
        color: Colors.textSecondary,
        fontSize: 14,
        lineHeight: 21,
    },
    patternCategory: {
        color: Colors.text,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 15,
    },

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
        flex: 1,
    },
    pickerLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginLeft: 5,
        fontWeight: 'bold',
    },
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
        color: Colors.error, 
    }
});