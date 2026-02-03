/**
 * TutorialNavigation - Skip/Back/Next/Complete buttons for tutorial
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useSettings } from '../../context/SettingsContext';

interface TutorialNavigationProps {
  currentIndex: number;
  totalSlides: number;
  onSkip: () => void;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}

export function TutorialNavigation({
  currentIndex,
  totalSlides,
  onSkip,
  onBack,
  onNext,
  onComplete,
}: TutorialNavigationProps) {
  const { isDarkMode } = useSettings();
  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === totalSlides - 1;

  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top row: Skip button */}
      <View style={styles.topRow}>
        {!isLastSlide ? (
          <Button
            mode="text"
            onPress={onSkip}
            textColor={colors.text}
            style={styles.skipButton}
          >
            Pular
          </Button>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

      {/* Bottom row: Back/Next or Complete */}
      <View style={styles.bottomRow}>
        {!isFirstSlide && (
          <Button
            mode="outlined"
            onPress={onBack}
            style={styles.navButton}
            icon="chevron-left"
          >
            Voltar
          </Button>
        )}

        {isLastSlide ? (
          <Button
            mode="contained"
            onPress={onComplete}
            style={[styles.navButton, styles.completeButton]}
            icon="check"
          >
            Comecar
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={onNext}
            style={styles.navButton}
            icon="chevron-right"
            contentStyle={styles.nextButtonContent}
          >
            Proximo
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  topRow: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  skipButton: {
    minWidth: 80,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  navButton: {
    flex: 1,
    borderRadius: 8,
  },
  completeButton: {
    flex: 2,
  },
  nextButtonContent: {
    flexDirection: 'row-reverse',
  },
});
