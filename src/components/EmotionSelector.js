import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../constants/Colors';
import { emotionTree } from '../data/emotionMap.js';

const abuelos = emotionTree;
const BUTTON_HEIGHT = 60;

const darkBackgroundColors = new Set([
  '#C763E0',
  '#4A90E2',
  '#D0021B',
]);

export default function EmotionSelector({ onEmotionSelected, initialEmotion = "" }) {
  const [activeAbuelo, setActiveAbuelo] = useState(null); 
  const [activePadre, setActivePadre] = useState(null);
  const [selection, setSelection] = useState({ abuelo: null, padre: null, nieto: null });

  useEffect(() => {
    if (initialEmotion) {
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
  }, [initialEmotion]);

  const handleAbueloPress = (abuelo) => {
    if (activeAbuelo === abuelo.name) {
      const finalSelection = { abuelo: abuelo.name, padre: null, nieto: null };
      setSelection(finalSelection);
      onEmotionSelected(abuelo.name);
      setActiveAbuelo(null);
      setActivePadre(null);
    } else {
      setActiveAbuelo(abuelo.name);
      setActivePadre(null); 
      setSelection({ abuelo: null, padre: null, nieto: null }); 
      onEmotionSelected("");
    }
  };

  const handlePadrePress = (padre) => {
    if (activePadre === padre.name) {
      const finalSelection = { abuelo: activeAbuelo, padre: padre.name, nieto: null };
      setSelection(finalSelection);
      onEmotionSelected(padre.name);
      setActiveAbuelo(null);
      setActivePadre(null);
    } else {
      setActivePadre(padre.name);
      setSelection({ abuelo: null, padre: null, nieto: null });
      onEmotionSelected("");
    }
  };
  
  const handleNietoPress = (nieto) => {
    const finalSelection = { abuelo: activeAbuelo, padre: activePadre, nieto: nieto.name };
    setSelection(finalSelection);
    onEmotionSelected(nieto.name);
    setActiveAbuelo(null);
    setActivePadre(null);
  };
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
  return (
    <View style={styles.wrapper}> 
      <View style={styles.container}>
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
    marginBottom: 20,
  },
  container: { 
    flexDirection: 'row',
    // ¡SIN HEIGHT FIJO! Dejamos que crezca con el contenido
  },
  column: { 
    flex: 1, 
    marginHorizontal: 4, 
    backgroundColor: Colors.card, 
    borderRadius: 12, 
    overflow: 'hidden', // Esto recorta las esquinas de los botones
    
    // Sombras modernas (Card Style)
    elevation: 3, // Android
    shadowColor: '#000', // iOS
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    shadowOffset: {width: 0, height: 2},
  },
  emotionButton: { 
    height: BUTTON_HEIGHT, 
    justifyContent: 'center', 
    alignItems: 'center', 
    // Línea separadora sutil en lugar de borde completo
    borderBottomWidth: 1, 
    borderBottomColor: Colors.inputBg, 
  },
  emotionText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  // ... (estilos de selection siguen igual)
  selection: { 
    backgroundColor: Colors.card,
    padding: 12, 
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width:0, height:2},
  },
  selectionText: { fontWeight: 'bold', fontSize: 15 },
  selectionTextDoneDark: { color: Colors.textDark },
  selectionTextDoneLight: { color: Colors.textLight },
  selectionTextExploring: { color: Colors.textMuted, fontStyle: 'italic' }
});