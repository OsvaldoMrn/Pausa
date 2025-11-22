// src/components/EmotionSelector.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
// NOTA: No necesitamos SafeAreaWrapper aquí, 
// porque EntryDetailScreen ya lo tiene.
import { Colors } from '../constants/Colors';
import { emotionTree } from '../data/emotionMap.js';

const abuelos = emotionTree;
const BUTTON_HEIGHT = 60;

// Colores base oscuros (para texto blanco)
const darkBackgroundColors = new Set([
  '#C763E0', // Morado
  '#4A90E2', // Azul
  '#D0021B', // Rojo
]);

// 1. EL COMPONENTE AHORA ACEPTA PROPS
export default function EmotionSelector({ onEmotionSelected, initialEmotion = "" }) {
  
  // 2. LÓGICA DE ESTADO
  // El estado "activo" (explorando) es interno
  const [activeAbuelo, setActiveAbuelo] = useState(null); 
  const [activePadre, setActivePadre] = useState(null);
  
  // El estado "final" (la selección)
  // ¡NUEVO! Se inicializa con el valor que viene de EntryDetailScreen
  const [selection, setSelection] = useState({ abuelo: null, padre: null, nieto: null });

  // 3. ¡NUEVO! ESTE EFFECTO CARGA LA EMOCIÓN INICIAL (si la hay)
  // Esto es para cuando CARGAS una entrada ya guardada
  useEffect(() => {
    if (initialEmotion) {
      // (Esta es una lógica simple, asume que no hay nombres repetidos)
      for (const abuelo of abuelos) {
        if (abuelo.name === initialEmotion) {
          setSelection({ abuelo: abuelo.name, padre: null, nieto: null });
          return;
        }
        for (const padre of abuelo.children) {
          if (padre.name === initialEmotion) {
            setSelection({ abuelo: abuelo.name, padre: padre.name, nieto: null });
            return;
          }
          for (const nieto of padre.children) {
            if (nieto.name === initialEmotion) {
              setSelection({ abuelo: abuelo.name, padre: padre.name, nieto: nieto.name });
              return;
            }
          }
        }
      }
    } else{
      setSelection({abuelo: null, padre: null, nieto: null});
      setActiveAbuelo(null);
      setActivePadre(null);
    }
  }, [initialEmotion]); // Solo se ejecuta 1 vez al cargar


  // --- Lógica de "Toques" (ACTUALIZADA) ---
  const handleAbueloPress = (abuelo) => {
    if (activeAbuelo === abuelo.name) {
      const finalSelection = { abuelo: abuelo.name, padre: null, nieto: null };
      setSelection(finalSelection);
      onEmotionSelected(abuelo.name); // 4. LLAMA AL "JEFE"
      setActiveAbuelo(null);
      setActivePadre(null);
    } else {
      setActiveAbuelo(abuelo.name);
      setActivePadre(null); 
      setSelection({ abuelo: null, padre: null, nieto: null }); 
      onEmotionSelected(""); // Resetea si solo está explorando
    }
  };

  const handlePadrePress = (padre) => {
    if (activePadre === padre.name) {
      const finalSelection = { abuelo: activeAbuelo, padre: padre.name, nieto: null };
      setSelection(finalSelection);
      onEmotionSelected(padre.name); // 4. LLAMA AL "JEFE"
      setActiveAbuelo(null);
      setActivePadre(null);
    } else {
      setActivePadre(padre.name);
      setSelection({ abuelo: null, padre: null, nieto: null });
      onEmotionSelected(""); // Resetea
    }
  };
  
  const handleNietoPress = (nieto) => {
    const finalSelection = { abuelo: activeAbuelo, padre: activePadre, nieto: nieto.name };
    setSelection(finalSelection);
    onEmotionSelected(nieto.name); // 4. LLAMA AL "JEFE"
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

  // --- Lógica de Estilo Dinámico (sin cambios) ---
  const hasFinalSelection = !!(selection.nieto || selection.padre || selection.abuelo);
  const finalAbueloObj = hasFinalSelection 
    ? abuelos.find(a => a.name === selection.abuelo) 
    : null;
  const dynamicBgStyle = {
    backgroundColor: finalAbueloObj 
      ? finalAbueloObj.color + '80' 
      : Colors.background,
    borderColor: finalAbueloObj
      ? finalAbueloObj.color 
      : Colors.border,
  };
  let dynamicTextStyle;
  if (hasFinalSelection && finalAbueloObj) {
    dynamicTextStyle = darkBackgroundColors.has(finalAbueloObj.color)
      ? styles.selectionTextDoneLight
      : styles.selectionTextDoneDark;
  } else {
    dynamicTextStyle = styles.selectionTextExploring;
  }
  // --- Fin Lógica de Estilo ---

  // 5. El JSX ahora es solo el componente, sin el Wrapper
  return (
    <View style={styles.wrapper}> 
      <View style={styles.container}>
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

      {/* CONTENEDOR DE CONFIRMACIÓN */}
      <View style={[styles.selection, dynamicBgStyle]}> 
        <Text style={[styles.selectionText, dynamicTextStyle]}>
          {getConfirmationText()}
        </Text>
      </View>
    </View>
  );
}

// 6. Los estilos son los mismos, solo añadí un 'wrapper'
const styles = StyleSheet.create({
  wrapper: {
    // Contenedor principal del componente
  },
  container: { 
    flexDirection: 'row', 
    // Quitamos padding, EntryDetailScreen lo maneja
  },
  column: { 
    flex: 1, 
    marginHorizontal: 3, // Un poco más junto
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
    fontSize: 14, // Un poco más pequeño
    fontWeight: '600', 
    color: Colors.text,
    textAlign: 'center', // Para nombres largos
    paddingHorizontal: 2, // Padding
  },
  selection: { 
    padding: 16, 
    borderRadius: 12,
    marginTop: 12, // Espacio entre columnas y caja
    borderWidth: 2,
  },
  selectionText: { 
    fontWeight: 'bold', 
    textAlign: 'center', 
    fontSize: 16,
  },
  selectionTextDoneDark: {
    color: Colors.textDark,
  },
  selectionTextDoneLight: {
    color: Colors.textLight,
  },
  selectionTextExploring: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  }
});