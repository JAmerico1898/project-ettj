/**
 * Tutorial screen - 8-slide onboarding with progress indicator
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TUTORIAL_SLIDES } from '../constants/educationalContent';
import { useSettings } from '../context/SettingsContext';
import {
  TutorialSlide,
  TutorialProgress,
  TutorialNavigation,
} from '../components/education';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TutorialScreen() {
  const router = useRouter();
  const { updateSetting, isDarkMode } = useSettings();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
  };

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setCurrentIndex(index);
    },
    []
  );

  const scrollToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
    setCurrentIndex(index);
  }, []);

  const handleSkip = useCallback(async () => {
    await updateSetting('tutorialCompleted', true);
    router.replace('/');
  }, [updateSetting, router]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < TUTORIAL_SLIDES.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, scrollToIndex]);

  const handleComplete = useCallback(async () => {
    await updateSetting('tutorialCompleted', true);
    router.replace('/');
  }, [updateSetting, router]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <FlatList
          ref={flatListRef}
          data={TUTORIAL_SLIDES}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TutorialSlide slide={item} />}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          bounces={false}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />
      </View>

      <TutorialProgress
        total={TUTORIAL_SLIDES.length}
        current={currentIndex}
      />

      <TutorialNavigation
        currentIndex={currentIndex}
        totalSlides={TUTORIAL_SLIDES.length}
        onSkip={handleSkip}
        onBack={handleBack}
        onNext={handleNext}
        onComplete={handleComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
