/**
 * ConceptCard - Expandable concept card with difficulty badge
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Concept, CONCEPT_CATEGORIES } from '../../constants/educationalContent';
import { DifficultyBadge } from './DifficultyBadge';
import { useSettings } from '../../context/SettingsContext';

interface ConceptCardProps {
  concept: Concept;
  onRelatedConceptPress?: (conceptId: string) => void;
  onRelatedTermPress?: (termId: string) => void;
}

export function ConceptCard({
  concept,
  onRelatedConceptPress,
  onRelatedTermPress,
}: ConceptCardProps) {
  const { isDarkMode } = useSettings();
  const [expanded, setExpanded] = useState(false);

  const colors = {
    surface: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#B0B0B0' : '#757575',
    primary: '#1976D2',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    highlight: isDarkMode ? '#263238' : '#E3F2FD',
  };

  const categoryInfo = CONCEPT_CATEGORIES[concept.category];

  return (
    <Card style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <Card.Content style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.categoryBadge}>
              <MaterialCommunityIcons
                name={categoryInfo.icon as any}
                size={16}
                color={colors.primary}
              />
              <Text variant="labelSmall" style={{ color: colors.textSecondary, marginLeft: 4 }}>
                {categoryInfo.label}
              </Text>
            </View>
            <DifficultyBadge difficulty={concept.difficulty} />
          </View>

          <Text variant="titleMedium" style={[styles.title, { color: colors.text }]}>
            {concept.title}
          </Text>

          <Text variant="bodyMedium" style={[styles.summary, { color: colors.textSecondary }]}>
            {concept.summary}
          </Text>

          <View style={styles.expandIndicator}>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.textSecondary}
            />
          </View>
        </Card.Content>
      </TouchableOpacity>

      {expanded && (
        <>
          <Divider style={{ backgroundColor: colors.border }} />
          <Card.Content style={styles.expandedContent}>
            <Text variant="bodyMedium" style={[styles.content, { color: colors.text }]}>
              {concept.content}
            </Text>

            {concept.formula && (
              <View style={[styles.formulaBox, { backgroundColor: colors.highlight }]}>
                <Text variant="labelSmall" style={{ color: colors.primary, marginBottom: 4 }}>
                  Formula:
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[styles.formulaText, { color: colors.text }]}
                >
                  {concept.formula}
                </Text>
              </View>
            )}

            {concept.relatedConcepts.length > 0 && (
              <View style={styles.relatedSection}>
                <Text variant="labelMedium" style={{ color: colors.textSecondary, marginBottom: 8 }}>
                  Conceitos Relacionados:
                </Text>
                <View style={styles.relatedTags}>
                  {concept.relatedConcepts.map((id) => (
                    <TouchableOpacity
                      key={id}
                      onPress={() => onRelatedConceptPress?.(id)}
                      style={[styles.relatedTag, { backgroundColor: colors.highlight }]}
                    >
                      <MaterialCommunityIcons
                        name="book-open-variant"
                        size={14}
                        color={colors.primary}
                      />
                      <Text variant="labelSmall" style={{ color: colors.primary, marginLeft: 4 }}>
                        {id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {concept.relatedTerms.length > 0 && (
              <View style={styles.relatedSection}>
                <Text variant="labelMedium" style={{ color: colors.textSecondary, marginBottom: 8 }}>
                  Termos do Glossario:
                </Text>
                <View style={styles.relatedTags}>
                  {concept.relatedTerms.map((id) => (
                    <TouchableOpacity
                      key={id}
                      onPress={() => onRelatedTermPress?.(id)}
                      style={[styles.relatedTag, { backgroundColor: colors.highlight }]}
                    >
                      <MaterialCommunityIcons
                        name="book-alphabet"
                        size={14}
                        color={colors.primary}
                      />
                      <Text variant="labelSmall" style={{ color: colors.primary, marginLeft: 4 }}>
                        {id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  header: {
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  summary: {
    lineHeight: 20,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  expandedContent: {
    paddingTop: 16,
  },
  content: {
    lineHeight: 24,
    marginBottom: 16,
  },
  formulaBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  formulaText: {
    fontFamily: 'monospace',
  },
  relatedSection: {
    marginTop: 8,
  },
  relatedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
