/**
 * Learning Hub screen - Categorized concepts with search and filters
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Searchbar, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
  LEARNING_CONCEPTS,
  CONCEPT_CATEGORIES,
  ConceptCategory,
} from '../constants/educationalContent';
import { useSettings } from '../context/SettingsContext';
import { CategoryFilter, ConceptCard } from '../components/education';

export default function LearningScreen() {
  const router = useRouter();
  const { isDarkMode } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ConceptCategory | null>(null);

  const colors = {
    background: isDarkMode ? '#121212' : '#F5F5F5',
    surface: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#B0B0B0' : '#757575',
    primary: '#1976D2',
  };

  const categories = Object.entries(CONCEPT_CATEGORIES).map(([key, value]) => ({
    key,
    label: value.label,
    icon: value.icon,
  }));

  const filteredConcepts = useMemo(() => {
    let concepts = LEARNING_CONCEPTS;

    // Filter by category
    if (selectedCategory) {
      concepts = concepts.filter((c) => c.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      concepts = concepts.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.summary.toLowerCase().includes(query) ||
          c.content.toLowerCase().includes(query)
      );
    }

    return concepts;
  }, [searchQuery, selectedCategory]);

  const handleRelatedConceptPress = (conceptId: string) => {
    // Scroll to the concept or highlight it
    const concept = LEARNING_CONCEPTS.find((c) => c.id === conceptId);
    if (concept) {
      setSelectedCategory(null);
      setSearchQuery(concept.title);
    }
  };

  const handleRelatedTermPress = (termId: string) => {
    router.push({
      pathname: '/glossary',
      params: { search: termId },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Buscar conceitos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchbar, { backgroundColor: colors.surface }]}
        iconColor={colors.primary}
      />

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat as ConceptCategory | null)}
        allLabel="Todos"
      />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Results count */}
        <Text variant="labelMedium" style={[styles.resultsText, { color: colors.textSecondary }]}>
          {filteredConcepts.length} conceito{filteredConcepts.length !== 1 ? 's' : ''} encontrado
          {filteredConcepts.length !== 1 ? 's' : ''}
        </Text>

        {/* Concept Cards */}
        {filteredConcepts.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            onRelatedConceptPress={handleRelatedConceptPress}
            onRelatedTermPress={handleRelatedTermPress}
          />
        ))}

        {/* Empty state */}
        {filteredConcepts.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={{ color: colors.textSecondary }}>
              Nenhum conceito encontrado
            </Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4 }}>
              Tente ajustar os filtros ou termos de busca
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  resultsText: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
});
