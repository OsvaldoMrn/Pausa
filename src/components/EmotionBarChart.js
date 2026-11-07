// src/components/EmotionBarChart.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Colors } from '../constants/Colors';

// LayoutAnimation debería funcionar automáticamente o degradarse suavemente.

export default function EmotionBarChart({ data }) {
    const [selectedBar, setSelectedBar] = useState(null);
    const [tooltipTimeout, setTooltipTimeout] = useState(null);

    if (!data || data.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDataText}>Sin datos suficientes.</Text>
            </View>
        );
    }

    const maxCount = Math.max(...data.map(d => d.count));
    const CHART_HEIGHT = 180; 

    const handlePress = (item) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        
        if (tooltipTimeout) clearTimeout(tooltipTimeout);

        setSelectedBar(item);

        const timeout = setTimeout(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setSelectedBar(null);
        }, 3000); // Le damos un poquito más de tiempo (3s) para leer
        
        setTooltipTimeout(timeout);
    };

    return (
        <View style={styles.container}>
            {/* Título simple arriba */}
            <Text style={styles.title}>Otras Frecuentes</Text>

            {/* ÁREA DEL GRÁFICO */}
            <View style={styles.chartArea}>
                {/* Líneas de referencia sutiles */}
                <View style={[styles.gridLine, { bottom: 0 }]} />
                <View style={[styles.gridLine, { bottom: CHART_HEIGHT / 2 }]} />
                <View style={[styles.gridLine, { bottom: CHART_HEIGHT }]} />

                <View style={styles.barsContainer}>
                    {data.map((item, index) => {
                        const heightPercentage = (item.count / maxCount); 
                        const barHeight = Math.max(heightPercentage * CHART_HEIGHT, 20); 
                        const isSelected = selectedBar && selectedBar.emotion === item.emotion;

                        return (
                            <View key={index} style={styles.barWrapper}>
                                {/* Valor numérico */}
                                <Text style={styles.barValue}>{item.count}</Text>
                                
                                {/* Barra */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => handlePress(item)}
                                    style={[
                                        styles.bar,
                                        { 
                                            height: barHeight, 
                                            backgroundColor: item.color || Colors.primary, // Fallback por si acaso
                                            opacity: isSelected ? 1 : 0.7,
                                            transform: [{ scale: isSelected ? 1.05 : 1 }]
                                        }
                                    ]}
                                />
                            </View>
                        );
                    })}
                </View>
            </View>
            
            {/* ZONA DE INFORMACIÓN (PIE DE GRÁFICO) */}
            {/* Aquí reemplazamos el "hintText" por el Tooltip dinámico */}
            <View style={styles.footerContainer}>
                {selectedBar ? (
                    // Muestra la info de la emoción seleccionada
                    <View style={styles.selectedInfoBadge}>
                         <View style={[styles.miniDot, { backgroundColor: selectedBar.color }]} />
                         <Text style={styles.selectedInfoText}>
                            <Text style={{ fontWeight: 'bold', color: Colors.text }}>{selectedBar.emotion}</Text>
                            : {selectedBar.count} veces
                        </Text>
                    </View>
                ) : (
                    // Muestra el texto de ayuda por defecto cuando no hay nada seleccionado
                    <Text style={styles.hintText}>Toca una barra para ver detalles</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 15,
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 15,
        paddingBottom: 5, // Menos padding abajo porque el footer ya tiene margen
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    noDataText: {
        color: Colors.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 20,
    },
    
    // GRÁFICO
    chartArea: {
        height: 200, 
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around', 
        alignItems: 'flex-end', 
        height: 180, 
        zIndex: 2,
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1, 
    },
    bar: {
        width: 24, 
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        marginBottom: 2,
    },
    barValue: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
        fontWeight: 'bold',
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: Colors.border,
        opacity: 0.3,
        zIndex: 1,
    },

    // NUEVO FOOTER (Donde sale la info)
    footerContainer: {
        height: 40, // Altura fija para evitar saltos de layout
        justifyContent: 'center',
        alignItems: 'center',
    },
    hintText: {
        fontSize: 12,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
    selectedInfoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background, // Fondo oscuro estilo "chip"
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectedInfoText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    miniDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
});