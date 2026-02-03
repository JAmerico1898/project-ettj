/**
 * Chart action buttons (share image, export CSV, navigate to data)
 */

import React from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { COLORS } from '../../constants/config';

interface ChartActionsProps {
  onShareImage: () => Promise<string | null>;
  csvContent: string;
  fileName: string;
  onNavigateToData?: () => void;
}

export function ChartActions({
  onShareImage,
  csvContent,
  fileName,
  onNavigateToData,
}: ChartActionsProps) {
  const [isSharing, setIsSharing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleShareImage = async () => {
    setIsSharing(true);
    try {
      const uri = await onShareImage();

      if (!uri) {
        Alert.alert('Erro', 'Nao foi possivel capturar a imagem do grafico.');
        return;
      }

      // Web platform - download the image
      if (Platform.OS === 'web') {
        try {
          // uri is a data URL on web from react-native-view-shot
          const link = document.createElement('a');
          link.href = uri;
          link.download = `${fileName}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          Alert.alert('Sucesso', 'Imagem baixada.');
        } catch (webError) {
          console.error('Web download error:', webError);
          // Fallback: open in new tab
          window.open(uri, '_blank');
          Alert.alert('Info', 'Imagem aberta em nova aba. Use o botao direito para salvar.');
        }
        return;
      }

      // Native platform - use sharing
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartilhar grafico ETTJ',
        });
      } else {
        Alert.alert(
          'Compartilhamento indisponivel',
          'O compartilhamento nao esta disponivel neste dispositivo.'
        );
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Erro', `Nao foi possivel compartilhar a imagem: ${error}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Web platform - download using Blob
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Sucesso', 'Arquivo CSV baixado.');
        return;
      }

      // Native platform - create file and share
      const csvFile = new File(Paths.cache, `${fileName}.csv`);
      await csvFile.write(csvContent);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(csvFile.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar dados CSV',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert(
          'Exportacao indisponivel',
          'A exportacao nao esta disponivel neste dispositivo.'
        );
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Erro', 'Nao foi possivel exportar os dados.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Button
          mode="outlined"
          onPress={handleShareImage}
          loading={isSharing}
          disabled={isSharing || isExporting}
          icon="share-variant"
          style={styles.button}
          compact
        >
          Imagem
        </Button>

        <Button
          mode="outlined"
          onPress={handleExportCSV}
          loading={isExporting}
          disabled={isSharing || isExporting}
          icon="file-export"
          style={styles.button}
          compact
        >
          CSV
        </Button>

        {onNavigateToData && (
          <Button
            mode="outlined"
            onPress={onNavigateToData}
            disabled={isSharing || isExporting}
            icon="table"
            style={styles.button}
            compact
          >
            Dados
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    borderColor: COLORS.primary,
  },
});
