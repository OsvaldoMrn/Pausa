// App.js
import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors } from '../constants/Colors.js';

// --- Importamos funciones de la BD ---
import {
  initDatabase,
  addEntry,
  getAllEntries,
  deleteEntry,
} from '../db/database.js';

export default function HomeScreen() {
  // Estado del formulario
  const [emotion, setEmotion] = useState('');
  const [intensity, setIntensity] = useState('');
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState([]);

  // Inicializamos la BD y cargamos datos
  useEffect(() => {
    initDatabase();
    loadEntries();
  }, []);

  // Cargar todas las entradas
  const loadEntries = () => {
    const data = getAllEntries();
    setEntries(data);
  };

  // Añadir nueva entrada
  const handleAddEntry = () => {
    if (!emotion.trim()) {
      Alert.alert('Error', 'La emoción es obligatoria');
      return;
    }

    const intensityNum = intensity ? parseInt(intensity, 10) : null;
    if (intensity && (isNaN(intensityNum) || intensityNum < 1 || intensityNum > 10)) {
      Alert.alert('Error', 'Intensidad debe ser entre 1 y 10');
      return;
    }

    const date = Date.now();
    const newId = addEntry(emotion.trim(), intensityNum, note.trim(), date);

    if (newId) {
      // Limpiar formulario
      setEmotion('');
      setIntensity('');
      setNote('');
      Keyboard.dismiss();

      // Recargar lista
      loadEntries();
    }
  };

  // Borrar entrada
  const handleDeleteEntry = (id) => {
    Alert.alert(
      'Borrar entrada',
      '¿Estás seguro de que quieres borrar esta entrada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            deleteEntry(id);
            loadEntries();
          },
        },
      ]
    );
  };

  // Renderizar cada entrada
  const renderEntry = ({ item }) => {
    const date = new Date(item.date).toLocaleString();
    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryEmotion}>{item.emotion}</Text>
          <Text style={styles.entryIntensity}>
            {item.intensity ? `Intensidad: ${item.intensity}/10` : 'Sin intensidad'}
          </Text>
        </View>

        {item.note ? <Text style={styles.entryNote}>{item.note}</Text> : null}

        <View style={styles.entryFooter}>
          <Text style={styles.entryDate}>{date}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteEntry(item.id)}
          >
            <Text style={styles.deleteButtonText}>Borrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="auto" />

        <Text style={styles.title}>¡Proyecto Pausa!</Text>

        {/* Formulario */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="¿Cómo te sientes? (ej: feliz, ansioso)"
            placeholderTextColor="#999"
            value={emotion}
            onChangeText={setEmotion}
          />

          <TextInput
            style={styles.input}
            placeholder="Intensidad (1-10, opcional)"
            placeholderTextColor="#999"
            value={intensity}
            onChangeText={setIntensity}
            keyboardType="numeric"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nota adicional (opcional)"
            placeholderTextColor="#999"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />

          <Button title="Guardar Entrada" onPress={handleAddEntry} color={Colors.primary} />
        </View>

        {/* Lista de entradas */}
        <Text style={styles.sectionTitle}>Tus entradas</Text>

        {entries.length === 0 ? (
          <Text style={styles.emptyText}>No hay entradas aún. ¡Empieza a registrar!</Text>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEntry}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: Colors.inputBg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  entryCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryEmotion: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  entryIntensity: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  entryNote: {
    fontSize: 15,
    color: Colors.textDark,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  deleteButton: {
    backgroundColor: Colors.deleteButton,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 20,
  },
});