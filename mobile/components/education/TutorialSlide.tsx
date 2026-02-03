/**
 * TutorialSlide - Individual slide content display for tutorial
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TutorialSlide as TutorialSlideType } from '../../constants/educationalContent';
import { useSettings } from '../../context/SettingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialSlideProps {
  slide: TutorialSlideType;
}

export function TutorialSlide({ slide }: TutorialSlideProps) {
  const { isDarkMode } = useSettings();

  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    surface: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    primary: '#1976D2',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#B0B0B0' : '#757575',
    highlight: isDarkMode ? '#263238' : '#E3F2FD',
  };

  return (
    <View style={[styles.container, { width: SCREEN_WIDTH }]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.highlight }]}>
          <MaterialCommunityIcons
            name={slide.icon as any}
            size={64}
            color={colors.primary}
          />
        </View>

        {/* Title */}
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: colors.text }]}
        >
          {slide.title}
        </Text>

        {/* Subtitle */}
        <Text
          variant="titleMedium"
          style={[styles.subtitle, { color: colors.primary }]}
        >
          {slide.subtitle}
        </Text>

        {/* Content */}
        <Text
          variant="bodyLarge"
          style={[styles.contentText, { color: colors.textSecondary }]}
        >
          {slide.content}
        </Text>

        {/* Highlight Points */}
        {slide.highlightPoints && slide.highlightPoints.length > 0 && (
          <Surface
            style={[styles.highlightsContainer, { backgroundColor: colors.surface }]}
            elevation={1}
          >
            {slide.highlightPoints.map((point, index) => (
              <View key={index} style={styles.highlightRow}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={colors.primary}
                  style={styles.checkIcon}
                />
                <Text
                  variant="bodyMedium"
                  style={[styles.highlightText, { color: colors.text }]}
                >
                  {point}
                </Text>
              </View>
            ))}
          </Surface>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  contentText: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  highlightsContainer: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  checkIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  highlightText: {
    flex: 1,
    lineHeight: 22,
  },
});
