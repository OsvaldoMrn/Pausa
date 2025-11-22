// src/screens/EntryDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, Button, StyleSheet, Alert,
    TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
// 1. IMPORTAMOS EL SLIDER
import Slider from '@react-native-community/slider';
import { Colors } from '../constants/Colors.js';
import { addEntry, updateEntry, getEntriesForDay, deleteEntry } from '../db/database.js';
import { useNavigation, useRoute } from '@react-navigation/native';
import SafeAreaWrapper from '../components/SafeAreaWrapper.js';
import EmotionSelector from '../components/EmotionSelector.js'; // Importamos tu componente

export default function EntryDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { date } = route.params;

    // 2. CREAMOS UNA REFERENCIA (la "manija")
    const scrollRef = useRef(null);

    // -- Estados -- 
    const [dayEntries, setDayEntries] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [emotion, setEmotion] = useState('');
    // 2. CAMBIAMOS EL VALOR INICIAL A '0'
    const [intensity, setIntensity] = useState('0');
    const [note, setNote] = useState('');
    const [existingEntry, setExistingEntry] = useState(null);

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const entries = getEntriesForDay(date);
        setDayEntries(entries)


        if (entries.length > 0) {
            setCurrentIndex(entries.length - 1);
        } else {
            setCurrentIndex(0);
        }
    }, [date]);

    useEffect(() => {
        const entry = dayEntries[currentIndex];

        if (entry) {
            // MODO LECTURA
            setEmotion(entry.emotion);
            setIntensity(entry.intensity?.toString() || '5');
            setNote(entry.note || '');
            setIsEditing(false);
        } else {
            // MODO CREACION
            setEmotion('');
            setIntensity('');
            setNote();
            setIsEditing(true);
        }
    }, [currentIndex, dayEntries]);

    const handleSave = () => {
        // 5. VALIDACIÓN MEJORADA
        if (!emotion) return Alert.alert('Falta información', 'Elige una emoción');
        const numericIntensity = parseInt(intensity);
        if (numericIntensity === 0) return Alert.alert('Falta información', 'Elige la intensidad');

        const [year, month, day] = date.split('-').map(Number);
        const now = new Date();
        const safeDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes()).getTime();

        const currentEntry = dayEntries[currentIndex];

        if (currentEntry) {
            // Editar existente (Opcional, si quieres permitirlo)
            updateEntry(currentEntry.id, emotion, numericIntensity, note, safeDate);
        } else {
            // Crear nueva
            addEntry(emotion, numericIntensity, note, safeDate);
        }

        navigation.goBack();
    };

    const handleDelete = () => {
        const currentEntry = dayEntries[currentIndex];
        if (!currentEntry) return;

        Alert.alert(
            "¿Eliminar esta entrada?",
            "No podrás recuperarla después.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => {
                        deleteEntry(currentEntry.id);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    const canEdit = isNewPage || isEditing;

    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const displayDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const currentEntry = dayEntries[currentIndex];
    const displayTime = currentEntry
        ? new Date(currentEntry.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // entrada guardada -> solo lectura
    const isReadOnly = !!currentEntry;
    const isNewPage = currentIndex === dayEntries.length;

    // manejo de flechas
    const goPrev = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };
    const goNext = () => {
        if (currentIndex < dayEntries.length) setCurrentIndex(currentIndex + 1);
    }

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
                <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>

                    {/* Header: Regresar + Fecha */}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>{"< Regresar"}</Text>
                    </TouchableOpacity>
                    <Text style={styles.date}>{displayDate}</Text>

                    {/* --- NUEVO: BARRA DE NAVEGACIÓN DE ENTRADAS --- */}
                    <View style={styles.navRow}>
                        {/* Flecha Izquierda */}
                        <TouchableOpacity
                            onPress={goPrev}
                            disabled={currentIndex === 0}
                            style={{ opacity: currentIndex === 0 ? 0.3 : 1, padding: 10 }}
                        >
                            <Text style={styles.navArrow}>{"◄"}</Text>
                        </TouchableOpacity>

                        {/* La Hora y el Indicador */}
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>{displayTime}</Text>
                            <Text style={styles.pageIndicator}>
                                {isNewPage ? "Nueva Entrada" : `Entrada ${currentIndex + 1} de ${dayEntries.length}`}
                            </Text>
                        </View>

                        {/* Flecha Derecha (Añadir/Siguiente) */}
                        <TouchableOpacity
                            onPress={goNext}
                            disabled={isNewPage} // Desactivar si ya estamos en la nueva
                            style={{ opacity: isNewPage ? 0.3 : 1, padding: 10 }}
                        >
                            {/* Si estamos en la última existente, mostramos un "+" para indicar "Nueva" */}
                            <Text style={styles.navArrow}>
                                {currentIndex === dayEntries.length - 1 ? "+" : "►"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {/* --------------------------------------------- */}

                    {/* Bloqueamos interacción si es solo lectura */}
                    <View
                        pointerEvents={canEdit ? "auto" : "none"}
                        style={{ opacity: canEdit ? 1 : 0.8 }}
                    >

                        <Text style={styles.label}>¿Cómo te sentiste?</Text>
                        <EmotionSelector
                            onEmotionSelected={setEmotion}
                            initialEmotion={emotion}
                        />

                        <Text style={styles.label}>Intensidad: {intensity}</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={10}
                            step={1}
                            value={parseInt(intensity)}
                            onValueChange={(value) => setIntensity(value.toString())}
                            minimumTrackTintColor={Colors.primary}
                            maximumTrackTintColor={Colors.border}
                            thumbTintColor={Colors.primary}
                            disabled={!canEdit} // Doble seguridad
                        />

                        <Text style={styles.label}>Notas del día</Text>
                        <TextInput
                            style={styles.textArea}
                            value={note}
                            onChangeText={setNote}
                            multiline
                            placeholder={isReadOnly ? "Sin notas" : "¿Qué pasó hoy? ¿Cómo te sentiste?"}
                            placeholderTextColor={Colors.textMuted}
                            onFocus={handleNoteFocus}
                            editable={canEdit} // No editable si es vieja
                        />
                    </View>

                    <View style={styles.buttonContainer}>

                        {/* CASO 1: Nueva Entrada -> Solo Guardar */}
                        {isNewPage && (
                            <Button title="Guardar Entrada" onPress={handleSave} color={Colors.primary} />
                        )}

                        {/* CASO 2: Entrada Existente + Modo Lectura -> Editar y Borrar */}
                        {!isNewPage && !isEditing && (
                            <View>
                                <Button
                                    title="Editar Entrada"
                                    onPress={() => setIsEditing(true)}
                                    color={Colors.primary}
                                />
                                {/* Espacio separador */}
                                <View style={{ height: 20 }} />
                                <Button
                                    title="Borrar Entrada"
                                    onPress={handleDelete}
                                    color={Colors.deleteButton || '#e74c3c'} // Rojo
                                />
                            </View>
                        )}

                        {/* CASO 3: Entrada Existente + Modo Edición -> Guardar Cambios y Cancelar */}
                        {!isNewPage && isEditing && (
                            <View>
                                <Button
                                    title="Guardar Cambios"
                                    onPress={handleSave}
                                    color={Colors.primary}
                                />
                                {/* Espacio separador */}
                                <View style={{ height: 20 }} />
                                <Button
                                    title="Cancelar Edición"
                                    onPress={() => {
                                        // Al cancelar, recargamos los datos originales
                                        const original = dayEntries[currentIndex];
                                        setEmotion(original.emotion);
                                        setIntensity(original.intensity.toString());
                                        setNote(original.note);
                                        setIsEditing(false);
                                    }}
                                    color={Colors.textSecondary || '#888'} // Gris
                                />
                            </View>
                        )}
                    </View>

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
    backButton: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 5 },
    backButtonText: { color: Colors.primary, fontSize: 16, fontWeight: '500' },
    date: { fontSize: 20, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginBottom: 10 },

    // Estilos de la barra de navegación
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.backgroundSecondary, // Un fondito sutil
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 20,
    },
    timeContainer: { alignItems: 'center' },
    timeText: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
    pageIndicator: { fontSize: 12, color: Colors.textMuted },
    navArrow: { fontSize: 24, color: Colors.primary, fontWeight: 'bold' },

    label: { fontSize: 16, marginTop: 10, marginBottom: 10, color: Colors.text },
    slider: { width: '100%', height: 40 },
    textArea: {
        height: 120, borderWidth: 1, borderColor: Colors.border,
        borderRadius: 8, padding: 10, textAlignVertical: 'top', marginBottom: 20,
        color: Colors.text // Asegura que el texto se vea
    },
    buttonContainer: {
        marginTop: 30,
        marginBottom: 20
    }
});