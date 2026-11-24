import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radii, shadows, touchTargets } from '../../constants/theme';
import { fontFamily } from '../../constants/typography';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeightPct?: `${number}%`;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeightPct = '88%',
}) => {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { maxHeight: maxHeightPct }]}>
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>
        {(title || subtitle) && (
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>
        )}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
            {footer}
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === 'web' ? 'none' : 'slide'}
      onRequestClose={onClose}
    >
      {Platform.OS === 'web' ? (
        content
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {content}
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderTopWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    zIndex: 2,
    ...shadows.floating,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outline,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.muted,
  },
  closeBtn: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    marginRight: -8,
    borderRadius: radii.pill,
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    gap: 10,
  },
});
