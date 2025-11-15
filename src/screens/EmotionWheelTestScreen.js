// src/screens/EntryDetailScreen.js
import React, { useState, useEffect } from 'react';
// 1. IMPORTS CORREGIDOS: Faltaban varios
import {
    View, Text, TextInput, Button, StyleSheet, Alert,
    TouchableOpacity, ScrollView
} from 'react-native';
import { Colors } from '../constants/Colors.js';
// 2. IMPORTS DE BD OPTIMIZADOS:
import {
    addEntry, updateEntry, getEntryByDateString
} from '../db/database.js';
import { useNavigation, useRoute } from '@react-navigation/native';
import SafeAreaWrapper from '../components/SafeAreaWrapper.js';

const emotions = [
    { name: 'feliz', emoji: '😊' },
    { name: 'triste', emoji: '😢' },
    { name: 'enojado', emoji: '😡' },
    { name: 'calmado', emoji: '😌' },
    { name: 'ansioso', emoji: '😰' },
];

export default function EntryDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { date } = route.params; // 'date' es 'YYYY-MM-DD'

    // Tus estados (sin cambios)
    const [emotion, setEmotion] = useState('');
    const [intensity, setIntensity] = useState('5');
    const [note, setNote] = useState('');

    // 3. NUEVO ESTADO: Para guardar la entrada si existe
    const [existingEntry, setExistingEntry] = useState(null);

    // 4. useEffect OPTIMIZADO
    useEffect(() => {
        // Usamos la función eficiente que creamos
        const entry = getEntryByDateString(date);

        if (entry) {
            // Si hay entrada, llenamos los campos
            setEmotion(entry.emotion);
            setIntensity(entry.intensity?.toString() || '5');
            setNote(entry.note || '');
            setExistingEntry(entry); // Guardamos la entrada
        } else {
            // Si NO hay entrada, reseteamos los campos
            setEmotion('');
            setIntensity('5');
            setNote('');
            setExistingEntry(null);
        }
    }, [date]); // Se ejecuta cada vez que la fecha del parámetro cambia

    // 5. handleSave OPTIMIZADO
    const handleSave = () => {
        if (!emotion) {
            Alert.alert('Error', 'Elige una emoción');
            return;
        }

        // Arreglo de zona horaria:
        // 'date' es 'YYYY-MM-DD' (ej: '2025-11-09')
        // new Date('2025-11-09') lo interpreta como UTC (medianoche en UTC)
        // lo que puede causar que sea el día ANTERIOR en tu zona horaria.
        // La forma segura es:
        const [year, month, day] = date.split('-').map(Number);
        const safeDate = new Date(year, month - 1, day);
        const dateMs = safeDate.getTime();

        // ¡Ya no necesitamos llamar a la BD!
        if (existingEntry) {
            updateEntry(existingEntry.id, emotion, parseInt(intensity), note, dateMs);
        } else {
            addEntry(emotion, parseInt(intensity), note, dateMs);
        }

        navigation.goBack();
    };

    // 6. LÓGICA DE FECHA CORREGIDA (para evitar el bug de UTC)
    const [year, month, day] = date.split('-').map(Number);
    const safeDate = new Date(year, month - 1, day);
    const displayDate = safeDate.toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <SafeAreaWrapper>
            {/* 7. Añadido ScrollView por si el teclado empuja los botones */}
            <ScrollView contentContainerStyle={styles.container}>
                {/* ¡AÑADIMOS ESTE BOTÓN! */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>{"<"}</Text>
                </TouchableOpacity>
                {/* Esta línea cumple tu requisito de hoy: */}
                <Text style={styles.date}>{displayDate}</Text>

                <Text style={styles.label}>¿Cómo te sentiste?</Text>
                <View style={styles.emotions}>
                    {emotions.map(e => (
                        <TouchableOpacity
                            key={e.name}
                            style={[
                                styles.emotionBtn,
                                // Corregido: 'emotion' es el estado, 'e.name' es el del map
                                emotion === e.name && styles.selected
                            ]}
                            onPress={() => setEmotion(e.name)}
                        >
                            <Text style={styles.emoji}>{e.emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Intensidad: {intensity}</Text>
                <View style={styles.slider}>
                    <Text>1</Text>
                    <TextInput
                        style={styles.input}
                        value={intensity}
                        onChangeText={setIntensity}
                        keyboardType="numeric"
                        maxLength={2} // Prevenimos '100'
                    />
                    <Text>10</Text>
                </View>

                <Text style={styles.label}>Notas del día</Text>
                <TextInput
                    style={styles.textArea}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    placeholder="¿Qué pasó hoy? ¿Cómo te sentiste?"
                    placeholderTextColor={Colors.textMuted}
                />

                <Button title="Guardar" onPress={handleSave} color={Colors.primary} />
            </ScrollView>
        </SafeAreaWrapper>
    );
}

// Estilos sin cambios, solo 'container' ahora es 'contentContainerStyle'
const styles = StyleSheet.create({
    container: {
        flexGrow: 1, // Permite que el ScrollView crezca
        padding: 20
    },
    backButton: {
      alignSelf: 'flex-start', // Para que no ocupe todo el ancho
      paddingVertical: 4,      // Un poco de padding
      marginBottom: 10,      // Separación del título de fecha
    },
    backButtonText: { // <-- Este es el estilo que faltaba
      color: Colors.primary,
      fontSize: 16, // (16 es más razonable, pero pon el tamaño que quieras)
      fontWeight: '500',
    },
    date: { fontSize: 20, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginBottom: 20 },
    label: { fontSize: 16, marginTop: 20, marginBottom: 10, color: Colors.text },
    emotions: { flexDirection: 'row', justifyContent: 'space-around' },
    emotionBtn: { padding: 15, borderRadius: 50, backgroundColor: '#f0f0f0' },
    selected: {
        backgroundColor: Colors.primary,
        // Añadimos una sombra/borde para que destaque
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 5,
    },
    emoji: { fontSize: 32 },
    slider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    input: {
        width: 50,
        textAlign: 'center',
        marginHorizontal: 20,
        borderBottomWidth: 1,
        borderColor: Colors.border, // Damos color al borde
        fontSize: 16, // Tamaño de fuente
    },
    textArea: {
        height: 120,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 10,
        textAlignVertical: 'top',
        marginBottom: 20, // Espacio antes del botón
    },
});