import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';
import { getEntriesByTag } from '../db/database';
import { getEmotionColor } from '../utils/emotionUtils';

const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });
};

const getDateString = (timestamp) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function TagDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { tagId, tagName } = route.params; 
    
    const [entries, setEntries] = useState([]);

    useEffect(() => {
        const data = getEntriesByTag(tagId);
        setEntries(data);
    }, [tagId]);

    const handleEntryPress = (timestamp) => {
        const dateString = getDateString(timestamp);
        navigation.navigate('EntryDetail', { date: dateString });
    };

    const renderItem = ({ item }) => {
        const color = getEmotionColor(item.emotion) || Colors.primary;
        
        return (
            <TouchableOpacity onPress={() => handleEntryPress(item.date)}>
                <View style={styles.cardItem}>
                    <View style={[styles.colorIndicator, { backgroundColor: color }]} />
                    
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                            <Text style={styles.emotionBadge}>{item.emotion}</Text>
                        </View>
                        
                        <Text style={styles.noteText} numberOfLines={2}>
                            {item.note}
                        </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title} numberOfLines={1}>
                        #{tagName}
                    </Text>
                    <View style={{width: 40}} /> 
                </View>

                <Text style={styles.subtitle}>
                    Mencionado en {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
                </Text>

                <FlatList
                    data={entries}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No se encontraron entradas asociadas.</Text>
                    }
                />
            </View>
        </SafeAreaWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    
    header: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        paddingHorizontal: 20, paddingTop: 10, marginBottom: 10 
    },
    backButton: { 
        width: 40, height: 40, borderRadius: 20, 
        backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center' 
    },
    title: { 
        fontSize: 22, fontWeight: 'bold', color: Colors.primary, 
        textTransform: 'capitalize', flex: 1, textAlign: 'center' 
    },
    subtitle: {
        textAlign: 'center', color: Colors.textSecondary, fontSize: 14,
        marginBottom: 20,
    },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    
    cardItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.card, borderRadius: 12,
        marginBottom: 12, padding: 15,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width:0, height:2}
    },
    colorIndicator: {
        width: 6, height: 50, borderRadius: 3, marginRight: 15,
    },
    cardContent: { flex: 1, marginRight: 10 },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 4
    },
    dateText: { 
        fontSize: 14, fontWeight: 'bold', color: Colors.text, textTransform: 'capitalize' 
    },
    emotionBadge: {
        fontSize: 12, color: Colors.textSecondary, fontWeight: '600'
    },
    noteText: { 
        fontSize: 14, color: Colors.textMuted, lineHeight: 20 
    },
    
    emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 50 }
});