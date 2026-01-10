import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';

export default function NotificationsScreen() {
  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
            <Ionicons name="notifications-off-outline" size={80} color={Colors.primary} style={{ opacity: 0.5 }} />
        </View>
        
        <Text style={styles.title}>Próximamente</Text>
        
        <Text style={styles.description}>
          Trabajando en ello
        </Text>

        <View style={styles.badge}>
            <Text style={styles.badgeText}>Disponible en v1.1</Text>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 30,
    backgroundColor: Colors.background 
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 100,
    backgroundColor: Colors.card,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: Colors.text, 
    marginBottom: 10 
  },
  description: { 
    fontSize: 16, 
    color: Colors.textSecondary, 
    textAlign: 'center', 
    lineHeight: 24,
    marginBottom: 30
  },
  badge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: Colors.primary + '20', // Color primario con transparencia
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary
  },
  badgeText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 12
  }
});