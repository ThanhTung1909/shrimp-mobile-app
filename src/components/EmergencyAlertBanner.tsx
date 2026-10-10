import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Vibration } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { dismissCurrentAlert } from '../store/slices/alertSlice';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export const EmergencyAlertBanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentAlert = useAppSelector((state) => state.alert.currentActiveAlert);

  useEffect(() => {
    if (currentAlert) {
      // Rung thiết bị khi nhận được cảnh báo khẩn cấp (Pattern: Chờ 0ms, rung 500ms, nghỉ 200ms, rung 500ms)
      Vibration.vibrate([0, 500, 200, 500]);
    }
  }, [currentAlert]);

  if (!currentAlert) {
    return null;
  }

  const handleDismiss = () => {
    dispatch(dismissCurrentAlert());
  };

  const isCritical = currentAlert.severity === 'CRITICAL';
  const backgroundColor = isCritical ? colors.errorContainer : '#FFF3CD';
  const textColor = isCritical ? colors.onErrorContainer : '#856404';
  const iconColor = isCritical ? colors.error : '#B7791F';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.iconRow}>
        <MaterialIcons name="warning" size={28} color={iconColor} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor }]}>
            🚨 {currentAlert.title} - {currentAlert.pondName}
          </Text>
          <Text style={[styles.message, { color: textColor }]}>
            {currentAlert.message}
          </Text>
          {currentAlert.metric && currentAlert.value !== undefined && (
            <Text style={[styles.detailText, { color: textColor }]}>
              Chỉ số: {currentAlert.metric} = {currentAlert.value} (Ngưỡng: {currentAlert.threshold ?? '---'})
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <MaterialIcons name="close" size={22} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.titleMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    ...typography.bodyMd,
    fontWeight: '500',
  },
  detailText: {
    ...typography.bodySmall,
    marginTop: 4,
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 4,
  },
});
