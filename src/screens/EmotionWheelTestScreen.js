// src/screens/EmotionWheelTestScreen.js
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';
import { emotionTree } from '../data/emotionMap.js';

const abuelos = emotionTree;
const BUTTON_HEIGHT = 60;

export default function EmotionWheelTestScreen() {
  const [activeAbuelo, setActiveAbuelo] = useState(null);
  const [activePadre, setActivePadre] = useState(null);
  const [activeHijo, setActiveHijo] = useState(null);

  const intervalRef = useRef(null);

  const startTracking = (column, index, setter) => {
    setter(index);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setter(index);
    }, 50);
  };

  const stopTracking = () => {
    clearInterval(intervalRef.current);
    setTimeout(() => {
      setActiveAbuelo(null);
      setActivePadre(null);
      setActiveHijo(null);
    }, 100);
  };

  const selectedAbuelo = abuelos.find(a => a.name === activeAbuelo);
  const selectedPadre = selectedAbuelo?.children.find(p => p.name === activePadre);

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>

        {/* COLUMNA 1 */}
        <View style={styles.column}>
          {abuelos.map((abuelo, i) => (
            <Pressable
              key={abuelo.name}
              style={[
                styles.emotionButton,
                activeAbuelo === abuelo.name && { backgroundColor: abuelo.color + '60' }
              ]}
              onPressIn={() => startTracking(1, abuelo.name, setActiveAbuelo)}
              onPressOut={stopTracking}
              onLongPress={() => {}}
            >
              <Text style={styles.emotionText}>{abuelo.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* COLUMNA 2 */}
        <View style={styles.column}>
          {selectedAbuelo?.children.map((padre, i) => (
            <Pressable
              key={padre.name}
              style={[
                styles.emotionButton,
                activePadre === padre.name && { backgroundColor: selectedAbuelo.color + '50' }
              ]}
              onPressIn={() => startTracking(2, padre.name, setActivePadre)}
              onPressOut={stopTracking}
            >
              <Text style={styles.emotionText}>{padre.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* COLUMNA 3 */}
        <View style={styles.column}>
          {selectedPadre?.children.map((hijo, i) => (
            <Pressable
              key={hijo.name}
              style={[
                styles.emotionButton,
                activeHijo === hijo.name && { backgroundColor: selectedAbuelo.color + '40' }
              ]}
              onPressIn={() => {
                setActiveHijo(hijo.name);
                clearInterval(intervalRef.current);
              }}
              onPressOut={stopTracking}
            >
              <Text style={styles.emotionText}>{hijo.name}</Text>
            </Pressable>
          ))}
        </View>

      </View>

      {/* SELECCIÓN */}
      {activeHijo && (
        <View style={styles.selection}>
          <Text style={styles.selectionText}>
            {activeAbuelo} → {activePadre} → {activeHijo}
          </Text>
        </View>
      )}
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', padding: 12 },
  column: { flex: 1, marginHorizontal: 6, backgroundColor: '#2a2a2a', borderRadius: 16, overflow: 'hidden' },
  emotionButton: { height: BUTTON_HEIGHT, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#444' },
  emotionText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  selection: { position: 'absolute', bottom: 50, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.9)', padding: 16, borderRadius: 12 },
  selectionText: { color: '#0f0', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
});