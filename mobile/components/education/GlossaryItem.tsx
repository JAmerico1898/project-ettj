/**
 * GlossaryItem - Term with definition and cross-references
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlossaryTerm, GLOSSARY_CATEGORIES } from '../../constants/educationalContent';
import { useSettings } from '../../context/SettingsContext';

interface GlossaryItemProps {
  term: GlossaryTerm;
  onRelatedTermPress?: (termId: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function GlossaryItem({
  term,
  onRelatedTermPress,
  expanded = false,
  onToggleExpand,
}: GlossaryItemProps) {
  const { isDarkMode } = useSettings();

  const colors = {
    surface: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#B0B0B0' : '#757575',
    primary: '#1976D2',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    highlight: isDarkMode ? '#263238' : '#E3F2FD',
  };

  const categoryInfo = GLOSSARY_CATEGORIES[term.category];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.7}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.termRow}>
            <Text variant="titleMedium" style={[styles.term, { color: colors.text }]}>
              {term.term}
            </Text>
            <View style={styles.categoryBadge}>
              <MaterialCommunityIcons
                name={categoryInfo.icon as any}
                size={14}
                color={colors.textSecondary}
              />
              <Text variant="labelSmall" style={{ color: colors.textSecondary, marginLeft: 2 }}>
                {categoryInfo.label}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>

        {!expanded && (
          <Text
            variant="bodySmall"
            numberOfLines={2}
            style={[styles.preview, { color: colors.textSecondary }]}
          >
            {term.definition}
          </Text>
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text variant="bodyMedium" style={[styles.definition, { color: colors.text }]}>
            {term.definition}
          </Text>

          {term.example && (
            <View style={[styles.exampleBox, { backgroundColor: colors.highlight }]}>
              <Text variant="labelSmall" style={{ color: colors.primary, marginBottom: 4 }}>
                Exemplo:
              </Text>
              <Text variant="bodySmall" style={{ color: colors.text }}>
                {term.example}
              </Text>
            </View>
          )}

          {term.relatedTerms.length > 0 && (
            <View style={styles.relatedSection}>
              <Text variant="labelSmall" style={{ color: colors.textSecondary, marginBottom: 8 }}>
                Ver tambem:
              </Text>
              <View style={styles.relatedTags}>
                {term.relatedTerms.map((relatedId) => (
                  <TouchableOpacity
                    key={relatedId}
                    onPress={() => onRelatedTermPress?.(relatedId)}
                    style={[styles.relatedTag, { backgroundColor: colors.highlight }]}
                  >
                    <MaterialCommunityIcons
                      name="link-variant"
                      size={12}
                      color={colors.primary}
                    />
                    <Text variant="labelSmall" style={{ color: colors.primary, marginLeft: 4 }}>
                      {relatedId}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <Divider style={{ backgroundColor: colors.border }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  termRow: {
    flex: 1,
  },
  term: {
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    marginTop: 4,
    lineHeight: 18,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  definition: {
    lineHeight: 24,
    marginBottom: 12,
  },
  exampleBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  relatedSection: {
    marginTop: 4,
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
    borderRadius: 12,
  },
});
