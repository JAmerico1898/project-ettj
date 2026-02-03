/**
 * API configuration dialog component
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Portal,
  Dialog,
  TextInput,
  Button,
  Text,
  HelperText,
} from 'react-native-paper';
import { COLORS } from '../constants/config';
import {
  SETTINGS_CONSTRAINTS,
  DEFAULT_SETTINGS,
} from '../constants/defaultSettings';

interface ApiConfigProps {
  visible: boolean;
  currentUrl: string;
  currentTimeout: number;
  onSave: (url: string, timeout: number) => void;
  onDismiss: () => void;
}

export function ApiConfig({
  visible,
  currentUrl,
  currentTimeout,
  onSave,
  onDismiss,
}: ApiConfigProps) {
  const [url, setUrl] = useState(currentUrl);
  const [timeout, setTimeout] = useState(String(currentTimeout / 1000));
  const [urlError, setUrlError] = useState<string | null>(null);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setUrl(currentUrl);
      setTimeout(String(currentTimeout / 1000));
      setUrlError(null);
      setTimeoutError(null);
    }
  }, [visible, currentUrl, currentTimeout]);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setUrlError('URL e obrigatoria');
      return false;
    }
    try {
      new URL(value);
      setUrlError(null);
      return true;
    } catch {
      setUrlError('URL invalida');
      return false;
    }
  };

  const validateTimeout = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setTimeoutError('Valor invalido');
      return false;
    }
    const ms = num * 1000;
    const { min, max } = SETTINGS_CONSTRAINTS.apiTimeout;
    if (ms < min || ms > max) {
      setTimeoutError(`Deve estar entre ${min / 1000} e ${max / 1000} segundos`);
      return false;
    }
    setTimeoutError(null);
    return true;
  };

  const handleSave = () => {
    const urlValid = validateUrl(url);
    const timeoutValid = validateTimeout(timeout);

    if (urlValid && timeoutValid) {
      onSave(url.trim(), parseFloat(timeout) * 1000);
      onDismiss();
    }
  };

  const handleReset = () => {
    setUrl(DEFAULT_SETTINGS.apiBaseUrl);
    setTimeout(String(DEFAULT_SETTINGS.apiTimeout / 1000));
    setUrlError(null);
    setTimeoutError(null);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Configuracao da API</Dialog.Title>
        <Dialog.Content>
          <View style={styles.inputContainer}>
            <TextInput
              label="URL Base"
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                if (urlError) validateUrl(text);
              }}
              onBlur={() => validateUrl(url)}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              error={!!urlError}
              style={styles.input}
            />
            <HelperText type="error" visible={!!urlError}>
              {urlError}
            </HelperText>

            <Text variant="bodySmall" style={styles.example}>
              Ex: http://192.168.1.100:8000
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Timeout (segundos)"
              value={timeout}
              onChangeText={(text) => {
                setTimeout(text);
                if (timeoutError) validateTimeout(text);
              }}
              onBlur={() => validateTimeout(timeout)}
              mode="outlined"
              keyboardType="numeric"
              error={!!timeoutError}
              style={styles.input}
            />
            <HelperText type="error" visible={!!timeoutError}>
              {timeoutError}
            </HelperText>
          </View>

          <Button
            mode="text"
            onPress={handleReset}
            style={styles.resetButton}
            compact
          >
            Restaurar Padrao
          </Button>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button onPress={handleSave} mode="contained">
            Salvar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
  },
  example: {
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  resetButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
});
