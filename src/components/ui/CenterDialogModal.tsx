import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/theme';

interface CenterDialogModalProps {
  visible: boolean;
  onClose?: () => void;
  dismissOnBackdrop?: boolean;
  children: React.ReactNode;
  accentBorderColor?: string;
}

export const CenterDialogModal: React.FC<CenterDialogModalProps> = ({
  visible,
  onClose,
  dismissOnBackdrop = true,
  children,
  accentBorderColor,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose || (() => {})}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (dismissOnBackdrop && onClose) {
              onClose();
            }
          }}
        />
        <View
          style={[
            styles.dialog,
            accentBorderColor
              ? { borderColor: accentBorderColor, borderWidth: 2 }
              : null,
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    ...shadows.floating,
  },
});
