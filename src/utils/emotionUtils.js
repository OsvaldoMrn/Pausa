// src/utils/emotionUtils.js
import { emotionTree } from '../data/emotionMap.js';

// Creamos un "mapa" (diccionario) para búsquedas rápidas
const colorMap = new Map();

// Llenamos el mapa una sola vez
emotionTree.forEach(abuelo => {
  const color = abuelo.color;
  
  // Añadimos al abuelo
  colorMap.set(abuelo.name, color);
  
  // Añadimos a los padres
  abuelo.children.forEach(padre => {
    colorMap.set(padre.name, color);
    
    // Añadimos a los nietos
    padre.children.forEach(nieto => {
      colorMap.set(nieto.name, color);
    });
  });
});

/**
 * Obtiene el color base (de "abuelo") para cualquier nombre de emoción.
 * @param {string} emotionName El nombre de la emoción (ej. "Orgulloso")
 * @returns {string | undefined} El código hexadecimal del color (ej. '#F8E71C')
 */
export const getEmotionColor = (emotionName) => {
  return colorMap.get(emotionName);
};