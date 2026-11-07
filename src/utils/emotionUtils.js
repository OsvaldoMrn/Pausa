import { emotionTree } from '../data/emotionMap.js';

const colorMap = new Map();

emotionTree.forEach(abuelo => {
  const color = abuelo.color;
  
  colorMap.set(abuelo.name, color);
  
  abuelo.children.forEach(padre => {
    colorMap.set(padre.name, color);
    
    padre.children.forEach(nieto => {
      colorMap.set(nieto.name, color);
    });
  });
});

export const getEmotionColor = (emotionName) => {
  return colorMap.get(emotionName);
};

export const getEmotionCategory = (emotionName) => {
  for (const root of emotionTree) {
    if (root.name === emotionName) return root.name;

    for (const parent of root.children) {
      if (parent.name === emotionName || parent.children.some(child => child.name === emotionName)) {
        return root.name;
      }
    }
  }

  return null;
};