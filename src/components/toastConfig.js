import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

const VARIANTS = {
  success: { icon: 'checkmark-circle', iconColor: COLORS.success, bg: '#ECFDF5', border: '#A7F3D0' },
  error: { icon: 'close-circle', iconColor: COLORS.danger, bg: '#FEF2F2', border: '#FECACA' },
  info: { icon: 'information-circle', iconColor: COLORS.accent, bg: COLORS.accentLight, border: '#FDE68A' },
};

function ToastCard({ variant, text1, text2 }) {
  const { icon, iconColor, bg, border } = VARIANTS[variant];

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      <View style={[styles.iconWrap, { backgroundColor: COLORS.card }]}>
        <Ionicons name={icon} size={26} color={iconColor} />
      </View>
      <View style={styles.textWrap}>
        {!!text1 && (
          <Text style={styles.title} numberOfLines={2}>
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text style={styles.subtitle} numberOfLines={3}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
}

export const toastConfig = {
  success: (props) => <ToastCard variant="success" {...props} />,
  error: (props) => <ToastCard variant="error" {...props} />,
  info: (props) => <ToastCard variant="info" {...props} />,
};

const styles = StyleSheet.create({
  card: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
