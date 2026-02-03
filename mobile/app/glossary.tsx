/**
 * Glossary screen - Searchable glossary grouped alphabetically
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, SectionList } from 'react-native';
import { Searchbar, Text } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import {
  GLOSSARY_TERMS,
  GlossaryTerm,
  getTermsGroupedByLetter,
} from '../constants/educationalContent';
import { useSettings } from '../context/SettingsContext';
import { GlossaryItem } from '../components/education';

interface SectionData {
  title: string;
  data: GlossaryTerm[];
}

export default function GlossaryScreen() {
  const { isDarkMode } = useSettings();
  const params = useLocalSearchParams<{ search?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.search || '');
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);

  const colors = {
    background: isDarkMode ? '#121212' : '#F5F5F5',
    surface: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#B0B0B0' : '#757575',
    primary: '#1976D2',
    sectionBg: isDarkMode ? '#263238' : '#E3F2FD',
  };

  // Handle incoming search param
  useEffect(() => {
    if (params.search) {
      setSearchQuery(params.search);
    }
  }, [params.search]);

  const filteredSections = useMemo((): SectionData[] => {
    let terms = GLOSSARY_TERMS;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      terms = terms.filter(
        (t) =>
          t.term.toLowerCase().includes(query) ||
          t.definition.toLowerCase().includes(query) ||
          t.id.toLowerCase().includes(query)
      );
    }

    // Sort alphabetically
    terms = [...terms].sort((a, b) => a.term.localeCompare(b.term, 'pt-BR'));

    // Group by first letter
    const grouped = terms.reduce(
      (acc, term) => {
        const letter = term.term[0].toUpperCase();
        if (!acc[letter]) {
          acc[letter] = [];
        }
        acc[letter].push(term);
        return acc;
      },
      {} as Record<string, GlossaryTerm[]>
    );

    // Convert to SectionList format
    return Object.keys(grouped)
      .sort()
      .map((letter) => ({
        title: letter,
        data: grouped[letter],
      }));
  }, [searchQuery]);

  const handleRelatedTermPress = useCallback((termId: string) => {
    // Find the term and expand it
    const term = GLOSSARY_TERMS.find((t) => t.id === termId);
    if (term) {
      setSearchQuery('');
      setExpandedTermId(termId);
      // Could also scroll to the term here with a ref
    }
  }, []);

  const handleToggleExpand = useCallback((termId: string) => {
    setExpandedTermId((prev) => (prev === termId ? null : termId));
  }, []);

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.sectionBg }]}>
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.primary }]}>
        {section.title}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: GlossaryTerm }) => (
    <GlossaryItem
      term={item}
      expanded={expandedTermId === item.id}
      onToggleExpand={() => handleToggleExpand(item.id)}
      onRelatedTermPress={handleRelatedTermPress}
    />
  );

  const totalTerms = filteredSections.reduce((sum, section) => sum + section.data.length, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Buscar termos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchbar, { backgroundColor: colors.surface }]}
        iconColor={colors.primary}
      />

      {/* Results count */}
      <Text variant="labelMedium" style={[styles.resultsText, { color: colors.textSecondary }]}>
        {totalTerms} termo{totalTerms !== 1 ? 's' : ''} encontrado{totalTerms !== 1 ? 's' : ''}
      </Text>

      {/* Glossary List */}
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={{ color: colors.textSecondary }}>
              Nenhum termo encontrado
            </Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4 }}>
              Tente outros termos de busca
            </Text>
          </View>
        }
      />
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
  resultsText: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
});
