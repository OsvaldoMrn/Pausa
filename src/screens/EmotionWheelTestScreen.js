// src/screens/EmotionWheelTestScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';
import { emotionTree } from '../data/emotionMap.js';

const abuelos = emotionTree;
const BUTTON_HEIGHT = 60;

// NUEVO: Definimos qué colores base son oscuros
// para saber cuándo usar texto blanco
const darkBackgroundColors = new Set([
  '#C763E0', // Morado
  '#4A90E2', // Azul
  '#D0021B', // Rojo
]);

export default function EmotionWheelTestScreen() {
  const [activeAbuelo, setActiveAbuelo] = useState(null); 
  const [activePadre, setActivePadre] = useState(null);
  
  const [selection, setSelection] = useState({ abuelo: null, padre: null, nieto: null });

  // --- Lógica de "Toques" (sin cambios) ---
  const handleAbueloPress = (abuelo) => {
    if (activeAbuelo === abuelo.name) {
      setSelection({ abuelo: abuelo.name, padre: null, nieto: null });
      setActiveAbuelo(null);
      setActivePadre(null);
    } else {
      setActiveAbuelo(abuelo.name);
      setActivePadre(null); 
      setSelection({ abuelo: null, padre: null, nieto: null }); 
    }
  };
  const handlePadrePress = (padre) => {
    if (activePadre === padre.name) {
      setSelection({ abuelo: activeAbuelo, padre: padre.name, nieto: null });
      setActiveAbuelo(null);
      setActivePadre(null);
    } else {
      setActivePadre(padre.name);
      setSelection({ abuelo: null, padre: null, nieto: null });
    }
  };
  const handleNietoPress = (nieto) => {
    setSelection({ abuelo: activeAbuelo, padre: activePadre, nieto: nieto.name });
    setActiveAbuelo(null);
    setActivePadre(null);
  };
  // --- Fin de la Lógica ---

  const selectedAbuelo = abuelos.find(a => a.name === activeAbuelo);
  const selectedPadre = selectedAbuelo?.children.find(p => p.name === activePadre);

  const getConfirmationText = () => {
    const { abuelo, padre, nieto } = selection;
    if (nieto) return nieto;
    if (padre) return padre;
    if (abuelo) return abuelo;
    if (activePadre) return `Explorando: ${activePadre}`;
    if (activeAbuelo) return `Explorando: ${activeAbuelo}`;
    return "Toca una emoción para empezar";
  };

  // --- Lógica de Estilo Dinámico ---
  const hasFinalSelection = !!(selection.nieto || selection.padre || selection.abuelo);
  
  // 1. Encontrar el objeto "abuelo" de la selección FINAL
  const finalAbueloObj = hasFinalSelection 
    ? abuelos.find(a => a.name === selection.abuelo) 
    : null;

  // 2. Determinar el color de fondo dinámico
  const dynamicBgStyle = {
    backgroundColor: finalAbueloObj 
      ? finalAbueloObj.color + '80' // Color con 80% opacidad
      : Colors.background, // Fondo blanco por defecto
    borderColor: finalAbueloObj
      ? finalAbueloObj.color // Borde del color sólido
      : Colors.border,
  };

  // 3. Determinar el estilo de texto dinámico
  let dynamicTextStyle;
  if (hasFinalSelection && finalAbueloObj) {
    // Si el color base está en nuestro Set, usa texto claro
    dynamicTextStyle = darkBackgroundColors.has(finalAbueloObj.color)
      ? styles.selectionTextDoneLight // Texto blanco
      : styles.selectionTextDoneDark; // Texto oscuro
  } else {
    // Si no hay selección, usa el estilo de "explorando"
    dynamicTextStyle = styles.selectionTextExploring;
  }
  // --- Fin Lógica de Estilo ---

  return (
    <SafeAreaWrapper style={styles.safeArea}>
      <View style={{flex: 1}}> 
        <View style={styles.container}>
          {/* ... Las 3 Columnas ... (sin cambios) */}
          {/* COLUMNA 1 */}
          <View style={styles.column}>
            {abuelos.map((abuelo) => (
              <Pressable
                key={abuelo.name}
                style={[
                  styles.emotionButton,
                  selection.abuelo === abuelo.name && { backgroundColor: abuelo.color + '80' },
                  activeAbuelo === abuelo.name && { backgroundColor: abuelo.color + '40' }
                ]}
                onPress={() => handleAbueloPress(abuelo)}
              >
                <Text style={styles.emotionText}>{abuelo.name}</Text>
              </Pressable>
            ))}
          </View>
          {/* COLUMNA 2 */}
          <View style={styles.column}>
            {selectedAbuelo?.children.map((padre) => (
              <Pressable
                key={padre.name}
                style={[
                  styles.emotionButton,
                  selection.padre === padre.name && { backgroundColor: selectedAbuelo.color + '80' },
                  activePadre === padre.name && { backgroundColor: selectedAbuelo.color + '40' }
                ]}
                onPress={() => handlePadrePress(padre)}
              >
                <Text style={styles.emotionText}>{padre.name}</Text>
              </Pressable>
            ))}
          </View>
          {/* COLUMNA 3 */}
          <View style={styles.column}>
            {selectedPadre?.children.map((hijo) => (
              <Pressable
                key={hijo.name}
                style={[ 
                  styles.emotionButton,
                  selection.nieto === hijo.name && { backgroundColor: selectedAbuelo.color + '80' }
                ]}
                onPress={() => handleNietoPress(hijo)}
              >
                <Text style={styles.emotionText}>{hijo.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 4. CONTENEDOR DE CONFIRMACIÓN (ACTUALIZADO) */}
        <View style={[styles.selection, dynamicBgStyle]}> 
          <Text style={[styles.selectionText, dynamicTextStyle]}>
            {getConfirmationText()}
          </Text>
        </View>

      </View>
    </SafeAreaWrapper>
  );
}

// ESTILOS ACTUALIZADOS
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundSecondary,
  },
  container: { 
    flexDirection: 'row', 
    padding: 12,
  },
  column: { 
    flex: 1, 
    marginHorizontal: 6, 
    backgroundColor: Colors.background, 
    borderRadius: 16, 
    overflow: 'hidden',
    borderColor: Colors.border,
    borderWidth: 1,
  },
  emotionButton: { 
    height: BUTTON_HEIGHT, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border,
  },
  emotionText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: Colors.text,
  },
  
  // Estilo del cuadro de selección
  selection: { 
    padding: 16, 
    borderRadius: 12,
    margin: 12,
    marginTop: 20,
    borderWidth: 2, // Borde más grueso
  },
  selectionText: { 
    fontWeight: 'bold', 
    textAlign: 'center', 
    fontSize: 16,
  },
  
  // Estilos de texto dinámicos
  selectionTextDoneDark: {
    color: Colors.textDark, // Texto oscuro
  },
  selectionTextDoneLight: {
    color: Colors.textLight, // Texto claro (blanco)
  },
  selectionTextExploring: {
    color: Colors.textMuted, // Texto gris claro
    fontStyle: 'italic',
  }
});