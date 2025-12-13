// src/components/WeeklyDonutChart.js
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { Colors } from '../constants/Colors';

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE_WIDTH = 25; // Grosor del anillo
const SEGMENT_LENGTH = CIRCUMFERENCE / 7; // Longitud de cada día

const SVG_SIZE = 200; // Tamaño del contenedor
const CENTER = 100;   // Centro (200 / 2)

// Aceptamos la data como prop
export default function WeeklyDonutChart({ data, totalDays, loggedDays }) {
    if (!data || data.length !== 7) return null;

    let cumulativeOffset = 0;
    const SEGMENT_ANGLE = 360 / 7;

    const getCoordinates = (angleInDegrees, radius) => {
        const angleInRadians = (angleInDegrees * Math.PI) / 180;
        return {
            x: radius * Math.cos(angleInRadians),
            y: radius * Math.sin(angleInRadians),
        };
    };

    return (
        <View style={styles.chartContainer}>
            <Svg height={SVG_SIZE} width={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
                <G transform={`translate(${CENTER}, ${CENTER}) rotate(-90)`}>
                    
                    {/* Iteramos sobre la data REAL para pintar */}
                    {data.map((dayData, index) => {
                        const segmentOffset = cumulativeOffset;
                        cumulativeOffset += SEGMENT_LENGTH;
                        
                        // Usamos el color de la data (que ya tiene el color de la emoción o Colors.border)
                        const segmentColor = dayData.color; 

                        return (
                            <Circle
                                key={index}
                                cx="0"
                                cy="0"
                                r={RADIUS}
                                fill="transparent"
                                stroke={segmentColor} // <-- Color dinámico
                                strokeWidth={STROKE_WIDTH}
                                strokeDasharray={`${SEGMENT_LENGTH}, ${CIRCUMFERENCE - SEGMENT_LENGTH}`}
                                strokeDashoffset={-segmentOffset}
                            />
                        );
                    })}
                </G>

                {/* Etiquetas de Días (Lun, Mar, etc.) */}
                <G transform={`translate(${CENTER}, ${CENTER})`}>
                    {data.map((dayData, index) => {
                        // Cálculo para centrar el texto en cada segmento
                        const currentAngle = (SEGMENT_ANGLE * index) + (SEGMENT_ANGLE / 2) - 90; 
                        
                        // Posicionamos las etiquetas un poco más afuera de la rosca
                        const coords = getCoordinates(currentAngle, RADIUS + 25); 
                        
                        return (
                             <SvgText
                                key={`label-${index}`}
                                x={coords.x}
                                y={coords.y}
                                fontSize="10"
                                fontWeight="bold"
                                fill={dayData.hasEntry ? Colors.text : Colors.textSecondary}
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {dayData.dayLabel}
                            </SvgText>
                        );
                    })}
                </G>
            </Svg>
            
            {/* Texto Central */}
            <View style={styles.centerTextContainer}>
                <Text style={styles.centerTextValue}>{loggedDays}/{totalDays}</Text>
                <Text style={styles.centerTextLabel}>días</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    centerTextContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerTextValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text, // Blanco en dark mode
    },
    centerTextLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: -5,
    },
});