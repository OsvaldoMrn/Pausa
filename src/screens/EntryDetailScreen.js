// src/screens/EntryDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, Button, StyleSheet, Alert,
    TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
// 1. IMPORTAMOS EL SLIDER
import Slider from '@react-native-community/slider';
import { Colors } from '../constants/Colors.js';
import { addEntry, updateEntry, getEntryByDateString } from '../db/database.js';
import { useNavigation, useRoute } from '@react-navigation/native';
import SafeAreaWrapper from '../components/SafeAreaWrapper.js';
import EmotionSelector from '../components/EmotionSelector.js'; // Importamos tu componente

export default function EntryDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { date } = route.params;

    // 2. CREAMOS UNA REFERENCIA (la "manija")
    const scrollRef = useRef(null);

    const [emotion, setEmotion] = useState('');
    // 2. CAMBIAMOS EL VALOR INICIAL A '0'
    const [intensity, setIntensity] = useState('0');
    const [note, setNote] = useState('');
    const [existingEntry, setExistingEntry] = useState(null);

    useEffect(() => {
        const entry = getEntryByDateString(date);

        if (entry) {
            setEmotion(entry.emotion);
            // 3. SI CARGA UNA ENTRADA, USA EL VALOR GUARDADO (o '5' por si acaso)
            setIntensity(entry.intensity?.toString() || '5');
            setNote(entry.note || '');
            setExistingEntry(entry);
        } else {
            // 4. SI ES UNA NUEVA ENTRADA, REINICIA A '0'
            setEmotion('');
            setIntensity('0');
            setNote('');
            setExistingEntry(null);
        }
    }, [date]);

    const handleSave = () => {
        // 5. VALIDACIÓN MEJORADA
        if (!emotion) {
            Alert.alert('Error', 'Por favor, elige una emoción.');
            return;
        }

        const numericIntensity = parseInt(intensity);
        if (numericIntensity === 0) {
            Alert.alert('Error', 'Por favor, elige un nivel de intensidad.');
            return;
        }

        const [year, month, day] = date.split('-').map(Number);
        const safeDate = new Date(year, month - 1, day);
        const dateMs = safeDate.getTime();

        if (existingEntry) {
            updateEntry(existingEntry.id, emotion, numericIntensity, note, dateMs);
        } else {
            addEntry(emotion, numericIntensity, note, dateMs);
        }

        navigation.goBack();
    };

    const [year, month, day] = date.split('-').map(Number);
    const safeDate = new Date(year, month - 1, day);
    const displayDate = safeDate.toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const handleNoteFocus = () => {
        // Damos un pequeño retraso (100ms) para
        // asegurarnos que el teclado ya empezó a subir
        setTimeout(() => {
            // Le decimos a nuestra "manija": ¡baja hasta el fondo!
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    return (
        <SafeAreaWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={styles.container}
                >
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Text style={styles.backButtonText}>{"< Regresar"}</Text>
                    </TouchableOpacity>

                    <Text style={styles.date}>{displayDate}</Text>

                    <Text style={styles.label}>¿Cómo te sentiste?</Text>
                    {/* 6. LE PASAMOS LA EMOCIÓN INICIAL AL CARGAR */}
                    <EmotionSelector
                        onEmotionSelected={setEmotion}
                        initialEmotion={emotion}
                    />

                    {/* 7. SECCIÓN DEL SLIDER REEMPLAZADA */}
                    <Text style={styles.label}>Intensidad: {intensity}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={10}
                        step={1} // Solo números enteros
                        value={parseInt(intensity)} // El valor debe ser un número
                        onValueChange={(value) => setIntensity(value.toString())}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.border}
                        thumbTintColor={Colors.primary}
                    />

                    <Text style={styles.label}>Notas del día</Text>
                    <TextInput
                        style={styles.textArea}
                        value={note}
                        onChangeText={setNote}
                        multiline
                        placeholder="¿Qué pasó hoy? ¿Cómo te sentiste?"
                        placeholderTextColor={Colors.textMuted}
                        onFocus={handleNoteFocus}
                    />

                    <Button title="Guardar" onPress={handleSave} color={Colors.primary} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaWrapper>
    );
}

// ESTILOS ACTUALIZADOS
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 100,
    },
    backButton: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
        marginBottom: 10,
    },
    backButtonText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '500',
    },
    date: { fontSize: 20, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginBottom: 20 },
    label: { fontSize: 16, marginTop: 20, marginBottom: 10, color: Colors.text },

    // 8. NUEVO ESTILO PARA EL SLIDER
    slider: {
        width: '100%',
        height: 40, // Altura para el área de toque
    },

    textArea: {
        height: 120,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 10,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
});