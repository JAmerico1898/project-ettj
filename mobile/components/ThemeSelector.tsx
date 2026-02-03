/**
 * Theme selection dialog component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, RadioButton, Text, Button } from 'react-native-paper';
import { ThemeMode, THEME_DISPLAY_NAMES } from '../constants/defaultSettings';
import { COLORS } from '../constants/config';

interface ThemeSelectorProps {
  visible: boolean;
  currentTheme: ThemeMode;
  onSelect: (theme: ThemeMode) => void;
  onDismiss: () => void;
}

const themeOptions: ThemeMode[] = ['light', 'dark', 'auto'];

export function ThemeSelector({
  visible,
  currentTheme,
  onSelect,
  onDismiss,
}: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] =
    React.useState<ThemeMode>(currentTheme);

  React.useEffect(() => {
    if (visible) {
      setSelectedTheme(currentTheme);
    }
  }, [visible, currentTheme]);

  const handleConfirm = () => {
    onSelect(selectedTheme);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Selecionar Tema</Dialog.Title>
        <Dialog.Content>
          <RadioButton.Group
            value={selectedTheme}
            onValueChange={(value) => setSelectedTheme(value as ThemeMode)}
          >
            {themeOptions.map((theme) => (
              <View key={theme} style={styles.radioItem}>
                <RadioButton.Item
                  label={THEME_DISPLAY_NAMES[theme]}
                  value={theme}
                  labelStyle={styles.radioLabel}
                />
                {theme === 'auto' && (
                  <Text variant="bodySmall" style={styles.hint}>
                    Segue as configuracoes do sistema
                  </Text>
                )}
              </View>
            ))}
          </RadioButton.Group>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button onPress={handleConfirm} mode="contained">
            Confirmar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  radioItem: {
    marginVertical: 4,
  },
  radioLabel: {
    color: COLORS.text,
  },
  hint: {
    color: COLORS.textSecondary,
    marginLeft: 52,
    marginTop: -8,
    marginBottom: 8,
  },
});
