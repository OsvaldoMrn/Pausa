import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { Colors } from '../constants/Colors';
import { getTagsWithCounts, deleteTag, addTag, regenerateAllTags, blockTag, unblockTag } from '../db/database';

const MIN_RELEVANCE = 3;
const CLOUD_SIZE = 5;

export default function TagsScreen() {
  const navigation = useNavigation()

  const [allTags, setAllTags] = useState([]);
  const [visibleTags, setVisibleTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTags = useCallback(() => {
    setTimeout(() => {
      const data = getTagsWithCounts();
      setAllTags(data);

      const relevant = data.filter(t => t.count >= MIN_RELEVANCE);
      const sorted = relevant.sort((a, b) => b.count - a.count);

      setVisibleTags(sorted);
    }, 50);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [loadTags])
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filtered = allTags.filter(t =>
        t.name.toLowerCase().includes(text.toLowerCase())
      );
      setVisibleTags(filtered.sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      const relevant = allTags.filter(t => t.count >= MIN_RELEVANCE);
      setVisibleTags(relevant.sort((a, b) => b.count - a.count));
    }
  };

  const handleCreateTag = () => {
    if (!searchQuery.trim()) return;

    const normalizedName = searchQuery.trim().toLowerCase();

    const exists = allTags.some(t => t.name === normalizedName);
    if (exists) {
      Alert.alert('Ya existe', 'Esa etiqueta ya está en tu lista.');
      return;
    }

    unblockTag(normalizedName);

    const newId = addTag(normalizedName);

    if (newId) {
      setSearchQuery('');
      Alert.alert(
        "Etiqueta Creada",
        `Se ha añadido "${normalizedName}". ¿Quieres buscarla en tus notas pasadas?`,
        [
          { text: "No", style: "cancel", onPress: () => loadTags() },
          {
            text: "Sí, buscar",
            onPress: () => {
              regenerateAllTags();
              loadTags();
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', 'No se pudo crear la etiqueta.');
    }
  };

  const handleManageTag = (tag) => {
    Alert.alert(
      `Gestionar "${tag.name}"`,
      `¿Qué deseas hacer con esta etiqueta?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear para siempre',
          style: 'destructive',
          onPress: () => {
            blockTag(tag.name);
            deleteTag(tag.id);
            loadTags();
          },
        },
        {
          text: 'Solo borrar esta vez',
          onPress: () => {
            deleteTag(tag.id);
            loadTags();
          },
        },
      ]
    );
  };

  const handleTagPress = (tag) => {
    navigation.navigate('TagDetail', {
      tagId: tag.id,
      tagName: tag.name
    });
  };

  const handleRegenerate = () => {
    Alert.alert(
      "Analizar historial",
      "Se re-escanearán tus notas antiguas aplicando tus filtros y bloqueos actuales.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Analizar",
          onPress: () => {
            const success = regenerateAllTags();
            if (success) {
              loadTags();
              Alert.alert("¡Listo!", "Historial actualizado.");
            }
          }
        }
      ]
    );
  };

  const renderTagCloud = () => {
    const topTags = visibleTags.slice(0, CLOUD_SIZE);

    if (topTags.length === 0) return null;

    return (
      <View style={styles.cloudContainer}>
        <Text style={styles.sectionTitle}>Temas principales</Text>
        <View style={styles.cloudWrapper}>
          {topTags.map((tag) => (
            <View key={tag.id} style={[styles.cloudChip, { backgroundColor: Colors.primary + '25' }]}>
              <TouchableOpacity onPress={() => handleTagPress(tag)} style={styles.cloudTextContainer}>
                <Text style={styles.cloudText}>
                  {tag.name} <Text style={styles.countText}>({tag.count})</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleManageTag(tag)} style={styles.cloudCloseBtn}>
                <Ionicons name="close" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderListItem = ({ item }) => (
    <View style={styles.listItem}>
      <TouchableOpacity style={styles.tagInfo} onPress={() => handleTagPress(item)}>
        <Ionicons name="pricetag-outline" size={20} color={Colors.textSecondary} />
        <Text style={styles.tagName}>{item.name}</Text>
        <Text style={styles.tagCountList}>({item.count})</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleManageTag(item)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );

  const listData = searchQuery ? visibleTags : visibleTags.slice(CLOUD_SIZE);

  return (
    <SafeAreaWrapper edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Mis Etiquetas</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tema..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && !visibleTags.some(t => t.name === searchQuery) && (
            <TouchableOpacity style={styles.addButton} onPress={handleCreateTag}>
              <Ionicons name="add-circle" size={28} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {!searchQuery && allTags.length > visibleTags.length && (
          <Text style={styles.filterInfo}>
            Mostrando temas con {MIN_RELEVANCE}+ menciones.
          </Text>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!searchQuery && renderTagCloud()}

          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Resultados' : 'Otros temas'}
          </Text>

          {listData.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No encontrada. Toca + para crear.'
                : (visibleTags.length > 0 ? 'No hay más temas fuera del Top 5.' : 'Aún no hay temas relevantes.')}
            </Text>
          ) : (
            <View style={styles.listContainer}>
              {listData.map(item => (
                <View key={item.id}>
                  {renderListItem({ item })}
                  <View style={styles.divider} />
                </View>
              ))}
            </View>
          )}

          {!searchQuery && (
            <View style={styles.footerContainer}>
              <TouchableOpacity onPress={handleRegenerate} style={styles.maintenanceButton}>
                <Ionicons name="refresh-circle" size={18} color={Colors.primary} />
                <Text style={styles.maintenanceText}>Re-analizar historial completo</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: 20 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 16 },
  addButton: { marginLeft: 10 },

  filterInfo: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 15, fontStyle: 'italic' },

  // Estilos de Nube Actualizados
  cloudContainer: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 15 },
  cloudWrapper: { flexDirection: 'row', flexWrap: 'wrap' },

  cloudChip: {
    flexDirection: 'row', // Para alinear texto y X
    alignItems: 'center',
    paddingLeft: 12, paddingRight: 8, paddingVertical: 6, // Padding ajustado para la X
    borderRadius: 20,
    marginRight: 8, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.primary
  },
  cloudTextContainer: { marginRight: 6 },
  cloudText: { color: Colors.text, fontWeight: '600' },
  countText: { fontSize: 12, color: Colors.textSecondary },
  cloudCloseBtn: {
    padding: 2,
    backgroundColor: 'rgba(0,0,0,0.2)', // Fondo sutil para la X
    borderRadius: 10
  },

  listContainer: { backgroundColor: Colors.card, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 5 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  tagInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tagName: { fontSize: 16, color: Colors.text, marginLeft: 10, textTransform: 'capitalize' },
  tagCountList: { fontSize: 14, color: Colors.textMuted, marginLeft: 5 },
  deleteButton: { padding: 5 },
  divider: { height: 1, backgroundColor: Colors.border },

  emptyText: { textAlign: 'center', color: Colors.textMuted, fontStyle: 'italic', marginTop: 20 },

  footerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20, opacity: 0.8 },
  maintenanceButton: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  maintenanceText: { color: Colors.primary, fontSize: 14, marginLeft: 5, textDecorationLine: 'underline' }
});