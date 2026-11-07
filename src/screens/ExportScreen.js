import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';
import { getEntriesByDateRange } from '../db/database';
import { getEmotionColor } from '../utils/emotionUtils';

export default function ExportScreen() {
    const [endDate, setEndDate] = useState(new Date());
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const calculateStats = (entries) => {
        if (!entries.length) return null;

        const totalEntries = entries.length;
        
        const totalIntensity = entries.reduce((sum, e) => sum + e.intensity, 0);
        const avgIntensity = (totalIntensity / totalEntries).toFixed(1);

        const emotionCounts = {};
        entries.forEach(e => {
            emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
        });
        const sortedEmotions = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => `<b>${name}</b> (${count})`)
            .join(' • ');

        const maxIntensityEntry = entries.reduce((prev, current) => 
            (prev.intensity > current.intensity) ? prev : current
        );
        const maxIntensityDate = new Date(maxIntensityEntry.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

        const daysMap = {};
        entries.forEach(e => {
            const dateKey = new Date(e.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
            daysMap[dateKey] = (daysMap[dateKey] || 0) + 1;
        });
        let busiestDayName = "";
        let busiestDayCount = 0;
        Object.entries(daysMap).forEach(([day, count]) => {
            if (count > busiestDayCount) {
                busiestDayCount = count;
                busiestDayName = day;
            }
        });

        return { 
            totalEntries, 
            avgIntensity, 
            sortedEmotions, 
            maxIntensityEntry: { ...maxIntensityEntry, dateFormatted: maxIntensityDate },
            busiestDay: { name: busiestDayName, count: busiestDayCount }
        };
    };

    const generateHTML = (entries, stats, startStr, endStr) => {
        const tableRows = entries.map(entry => {
            const dateObj = new Date(entry.date);
            const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
            const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const color = getEmotionColor(entry.emotion);
            
            return `
              <tr>
                <td style="width: 18%; font-weight: bold; color: #555;">
                    ${dateStr}<br>
                    <span style="font-size: 0.8em; color: #999;">${timeStr}</span>
                </td>
                <td style="width: 27%;">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${color}; margin-right: 8px;"></div>
                        <strong>${entry.emotion}</strong>
                    </div>
                    <div style="font-size: 0.85em; color: #666; margin-top: 4px;">Intensidad: <b>${entry.intensity}/10</b></div>
                </td>
                <td style="width: 55%; color: #333; font-style: ${entry.note ? 'normal' : 'italic'}; background-color: #fafafa; padding: 10px; border-radius: 4px;">
                    ${entry.note || 'Sin nota agregada.'}
                </td>
              </tr>
            `;
        }).join('');

        return `
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; background-color: #fff; }
                h1 { color: ${Colors.primary}; margin-bottom: 5px; }
                .meta-info { color: #888; font-size: 0.9em; margin-bottom: 30px; border-bottom: 2px solid ${Colors.primary}; padding-bottom: 15px; }
                
                .summary-container { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 15px; 
                    margin-bottom: 40px; 
                }

                .summary-row { 
                    display: flex; 
                    gap: 15px; 
                }
                .card { 
                    background: #f9f9f9; 
                    border: 1px solid #eee; 
                    border-radius: 8px; 
                    padding: 15px; 
                    flex: 1; 
                }
                
                .card-alert { border-left: 4px solid #ff6b6b; background: #fff5f5; }
                .card-info { border-left: 4px solid #4ecdc4; background: #f0fbfb; }
                
                .stat-value { font-size: 1.4em; font-weight: bold; color: #333; }
                .stat-label { font-size: 0.75em; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
                
                .big-text { font-size: 1.1em; line-height: 1.4; }

                h3 { margin-top: 0; color: #555; text-transform: uppercase; font-size: 1em; letter-spacing: 1px; }
                table { width: 100%; border-collapse: separate; border-spacing: 0 10px; }
                th { text-align: left; color: #aaa; font-size: 0.8em; font-weight: bold; padding: 0 10px; }
                td { vertical-align: top; border-bottom: 1px solid #eee; padding: 10px; }
                
                .footer { margin-top: 50px; text-align: center; color: #ccc; font-size: 0.8em; border-top: 1px solid #eee; padding-top: 20px; }
              </style>
            </head>
            <body>
              <h1>Reporte Clínico: Pausa 🌿</h1>
              <div class="meta-info">
                Generado el ${new Date().toLocaleDateString('es-ES')} • Período: <b>${startStr} - ${endStr}</b>
              </div>

              <h3>Resumen</h3>
              <div class="summary-container">
                
                <div class="summary-row">
                    <div class="card" style="text-align: center;">
                        <div class="stat-value">${stats.totalEntries}</div>
                        <div class="stat-label">Total Registros</div>
                    </div>
                    <div class="card" style="text-align: center;">
                        <div class="stat-value">${stats.avgIntensity}/10</div>
                        <div class="stat-label">Intensidad Promedio</div>
                    </div>
                </div>

                <div class="card">
                    <div class="big-text" style="color: ${Colors.primary};">${stats.sortedEmotions}</div>
                    <div class="stat-label">Top 5 Emociones Frecuentes</div>
                </div>

                <div class="card card-alert">
                    <div style="font-weight: bold; color: #d63031;">${stats.maxIntensityEntry.dateFormatted}</div>
                    <div style="margin-top: 5px;">
                        Sintió <b style="text-transform: uppercase;">${stats.maxIntensityEntry.emotion}</b> con intensidad <b>${stats.maxIntensityEntry.intensity}/10</b>.
                    </div>
                    <div class="stat-label">Pico Máximo de Intensidad Registrado</div>
                </div>

                <div class="card card-info">
                    <div style="font-weight: bold; color: #00b894;">${stats.busiestDay.name}</div>
                    <div style="margin-top: 5px;">
                        Se realizaron <b>${stats.busiestDay.count} registros</b> ese día.
                    </div>
                    <div class="stat-label">Día con Mayor Actividad de Escritura</div>
                </div>

              </div>

              <h3 style="margin-top: 40px; border-top: 2px solid #eee; padding-top: 20px;">Bitácora Detallada</h3>
              <table>
                <thead>
                  <tr>
                    <th>FECHA / HORA</th>
                    <th>EMOCIÓN</th>
                    <th>NOTA / CONTEXTO</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
              
              <div class="footer">
                Documento generado por la aplicación móvil Pausa. Uso personal y confidencial.
              </div>
            </body>
          </html>
        `;
    };

    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        try {
            const start = new Date(startDate); start.setHours(0,0,0,0);
            const end = new Date(endDate); end.setHours(23,59,59,999);

            const entries = getEntriesByDateRange(start.getTime(), end.getTime());

            if (entries.length === 0) {
                Alert.alert("Sin datos", "No hay registros en las fechas seleccionadas.");
                setIsGenerating(false);
                return;
            }

            const stats = calculateStats(entries);
            const startStr = start.toLocaleDateString('es-ES');
            const endStr = end.toLocaleDateString('es-ES');

            const html = generateHTML(entries, stats, startStr, endStr);

            const { uri } = await Print.printToFileAsync({ html });
            
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

        } catch (error) {
            Alert.alert("Error", "No se pudo generar el PDF: " + error.message);
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper visual
    const formatDateBtn = (date) => date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <SafeAreaWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerContainer}>
                    <Ionicons name="document-text-outline" size={60} color={Colors.primary} />
                    <Text style={styles.title}>Exportar Reporte</Text>
                    <Text style={styles.subtitle}>Selecciona el rango de fechas para generar el PDF.</Text>
                </View>

                {/* SELECTORES DE FECHA */}
                <View style={styles.datesContainer}>
                    <View style={styles.dateBox}>
                        <Text style={styles.label}>Desde:</Text>
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
                            <Text style={styles.dateText}>{formatDateBtn(startDate)}</Text>
                            <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateBox}>
                        <Text style={styles.label}>Hasta:</Text>
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
                            <Text style={styles.dateText}>{formatDateBtn(endDate)}</Text>
                            <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Pickers */}
                {showStartPicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={(e, date) => { setShowStartPicker(false); if(date) setStartDate(date); }}
                        maximumDate={endDate}
                    />
                )}
                {showEndPicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={(e, date) => { setShowEndPicker(false); if(date) setEndDate(date); }}
                        minimumDate={startDate}
                        maximumDate={new Date()}
                    />
                )}

                {/* INFO EXTRA */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={24} color={Colors.primary} />
                    <Text style={styles.infoText}>
                        El reporte incluye un resumen clínico (picos de intensidad, días activos) y la bitácora completa.
                    </Text>
                </View>

                {/* BOTÓN */}
                <TouchableOpacity 
                    style={[styles.generateBtn, isGenerating && { opacity: 0.7 }]} 
                    onPress={handleGeneratePDF}
                    disabled={isGenerating}
                >
                    <Text style={styles.generateBtnText}>
                        {isGenerating ? "Generando..." : "Generar PDF"}
                    </Text>
                    {!isGenerating && <Ionicons name="download-outline" size={24} color="#FFF" style={{marginLeft: 10}} />}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaWrapper>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, alignItems: 'center' },
    headerContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginTop: 10 },
    subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 5, paddingHorizontal: 20 },
    
    datesContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
    dateBox: { flex: 1, marginHorizontal: 5 },
    label: { fontSize: 14, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 5 },
    dateBtn: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: Colors.card, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.border
    },
    dateText: { fontSize: 16, color: Colors.text },

    infoBox: { 
        flexDirection: 'row', alignItems: 'center', 
        backgroundColor: Colors.primary + '15', 
        padding: 15, borderRadius: 12, marginBottom: 30 
    },
    infoText: { flex: 1, marginLeft: 10, color: Colors.text, fontSize: 14, lineHeight: 20 },

    generateBtn: { 
        backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        width: '100%', padding: 18, borderRadius: 16, elevation: 4, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 5
    },
    generateBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});