import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors.js';

export default function SafeAreaWrapper({ children, style, edges = ['top', 'left', 'right', 'bottom'] }) {
  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
});