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
import { Ionicons } from '@expo/vector-icons';

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

    const CustomButton = ({title, onPress, color, outline}) => (
        <TouchableOpacity
            onPress={onPress} 
            style={[
                styles.customButton, 
                { backgroundColor: outline ? 'transparent' : color, borderColor: color, borderWidth: outline ? 1 : 0 }
            ]}
        >
            <Text style={[styles.customButtonText, {color: outline ? color : '#FFF'}]}>{title}</Text>
        </TouchableOpacity>
    )

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
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView ref={scrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                    {/* Header Moderno */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundButton}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerDate}>{displayDate}</Text>
                        <View style={{width: 40}} /> 
                    </View>

                    {/* Navegación Estilo Tarjeta */}
                    <View style={styles.card}>
                        <View style={styles.navRow}>
                            <TouchableOpacity onPress={goPrev} disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0.3 : 1, padding: 10 }}>
                                <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                            </TouchableOpacity>

                            <View style={styles.timeContainer}>
                                <Text style={styles.timeText}>{displayTime}</Text>
                                <Text style={styles.pageIndicator}>{isNewPage ? "Nueva Entrada" : `Entrada ${currentIndex + 1} de ${dayEntries.length}`}</Text>
                            </View>

                            <TouchableOpacity onPress={goNext} disabled={isNewPage} style={{ opacity: isNewPage ? 0.3 : 1, padding: 10 }}>
                                <Ionicons name={currentIndex === dayEntries.length - 1 ? "add" : "chevron-forward"} size={24} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View pointerEvents={canEdit ? "auto" : "none"} style={{ opacity: canEdit ? 1 : 0.6 }}>
                        
                        {/* Selector de Emoción */}
                        <Text style={styles.sectionLabel}>¿Cómo te sentiste?</Text>
                        <EmotionSelector onEmotionSelected={setEmotion} initialEmotion={emotion} />

                        {/* Slider Nativo */}
                        <View style={styles.card}>
                            <View style={styles.sliderHeader}>
                                <Text style={styles.cardLabel}>Intensidad</Text>
                                <Text style={styles.intensityValue}>{intensity}/10</Text>
                            </View>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={0}
                                maximumValue={10}
                                step={1}
                                value={parseInt(intensity)}
                                onValueChange={(val) => setIntensity(val.toString())}
                                minimumTrackTintColor={Colors.primary}
                                maximumTrackTintColor={Colors.inputBg}
                                thumbTintColor={Colors.primary}
                                disabled={!canEdit}
                            />
                        </View>

                        {/* Notas */}
                        <Text style={styles.sectionLabel}>Notas</Text>
                        <TextInput
                            style={styles.noteInput} // Estilo tarjeta
                            value={note}
                            onChangeText={setNote}
                            multiline
                            placeholder={isReadOnly ? "Sin notas" : "Escribe aquí..."}
                            placeholderTextColor={Colors.textMuted}
                            onFocus={handleNoteFocus}
                            editable={canEdit}
                        />
                    </View>

                    {/* Botones de Acción */}
                    <View style={styles.buttonContainer}>
                        {isNewPage && (
                            <CustomButton title="Guardar Entrada" onPress={handleSave} color={Colors.primary} />
                        )}

                        {!isNewPage && !isEditing && (
                            <View style={styles.rowButtons}>
                                <CustomButton title="Editar" onPress={() => setIsEditing(true)} color={Colors.primary} outline />
                                <View style={{ width: 10 }} />
                                <CustomButton title="Borrar" onPress={handleDelete} color={Colors.deleteButton} outline />
                            </View>
                        )}

                        {!isNewPage && isEditing && (
                            <View style={styles.rowButtons}>
                                <CustomButton title="Guardar" onPress={handleSave} color={Colors.primary} />
                                <View style={{ width: 10 }} />
                                <CustomButton title="Cancelar" onPress={() => {
                                    const original = dayEntries[currentIndex];
                                    setEmotion(original.emotion);
                                    setIntensity(original.intensity.toString());
                                    setNote(original.note);
                                    setIsEditing(false);
                                }} color={Colors.textSecondary} outline />
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
    container: { flexGrow: 1, padding: 20, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width:0, height:2} },
    headerDate: { fontSize: 18, fontWeight: 'bold', color: Colors.text, textTransform: 'capitalize' },
    
    card: { backgroundColor: Colors.card, borderRadius: 16, padding: 15, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: {width:0, height:4} },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timeContainer: { alignItems: 'center' },
    timeText: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
    pageIndicator: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    
    sectionLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 10, marginLeft: 4 },
    
    sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    cardLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
    intensityValue: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
    
    noteInput: { backgroundColor: Colors.card, borderRadius: 16, padding: 15, height: 150, textAlignVertical: 'top', fontSize: 16, color: Colors.text, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: {width:0, height:4}, marginBottom: 20 },
    
    buttonContainer: { marginTop: 10 },
    rowButtons: { flexDirection: 'row', flex: 1 },
    customButton: { flex: 1, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 0 },
    customButtonText: { fontSize: 16, fontWeight: 'bold' },
});