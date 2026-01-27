import { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  HelperText,
  Switch,
  Chip,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { z } from 'zod';
import { useThemeStore } from '@/stores/useTheme';
import GlassCard from '@/components/ui/GlassCard';

const changeBaseSchema = z.object({
  currentPassword: z.string().min(8, 'Enter your current password'),
  newPassword: z
    .string()
    .min(8, 'New password must contain at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirmPassword: z.string(),
  enableBiometric: z.boolean().optional(),
});

const changeSchema = changeBaseSchema
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from current password',
  });

type ChangeForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  enableBiometric?: boolean;
};

export default function ChangePasswordScreen() {
  const { colors } = useThemeStore();
  const [formData, setFormData] = useState<ChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    enableBiometric: false,
  });
  const [secureStates, setSecureStates] = useState({
    current: true,
    next: true,
    confirm: true,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ChangeForm, string>>
  >({});

  const formIsValid = useMemo(
    () => changeSchema.safeParse(formData).success,
    [formData]
  );

  const handleChange = (field: keyof ChangeForm, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateField = (field: keyof ChangeForm) => {
    const schema =
      changeBaseSchema.shape[field as keyof typeof changeBaseSchema.shape];
    if (!schema) {
      return;
    }

    const result = schema.safeParse(formData[field]);
    let message = result.success ? undefined : result.error.issues[0]?.message;

    if (!message && field === 'confirmPassword') {
      message =
        formData.confirmPassword === formData.newPassword
          ? undefined
          : 'Passwords must match';
    }

    if (!message && field === 'newPassword') {
      message =
        formData.newPassword !== formData.currentPassword
          ? undefined
          : 'New password must be different from current password';
    }

    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  };

  const handleSubmit = () => {
    const result = changeSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ChangeForm, string>> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof ChangeForm;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    Alert.alert('Password updated', 'Your credentials were refreshed.');
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.hero, { backgroundColor: colors.primary + '1a' }]}>
        <MaterialCommunityIcons
          name="form-textbox-password"
          size={34}
          color={colors.primary}
        />
        <Text
          variant="headlineSmall"
          style={{ color: colors.primary, marginTop: 8 }}
        >
          Refresh your password
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: colors.textSecondary,
            marginTop: 6,
            textAlign: 'center',
          }}
        >
          Keep your EstateOS workspace secure with a modern credential policy.
        </Text>
      </View>

      <GlassCard style={styles.formCard}>
        <Text
          variant="titleMedium"
          style={{ color: colors.text, marginBottom: 12 }}
        >
          Secure update
        </Text>

        <TextInput
          label="Current password"
          value={formData.currentPassword}
          onChangeText={(value) => handleChange('currentPassword', value)}
          onBlur={() => validateField('currentPassword')}
          secureTextEntry={secureStates.current}
          style={styles.input}
          left={<TextInput.Icon icon="lock-alert-outline" />}
          right={
            <TextInput.Icon
              icon={secureStates.current ? 'eye-off-outline' : 'eye-outline'}
              onPress={() =>
                setSecureStates((prev) => ({ ...prev, current: !prev.current }))
              }
            />
          }
        />
        <HelperText type="error" visible={Boolean(errors.currentPassword)}>
          {errors.currentPassword}
        </HelperText>

        <TextInput
          label="New password"
          value={formData.newPassword}
          onChangeText={(value) => handleChange('newPassword', value)}
          onBlur={() => validateField('newPassword')}
          secureTextEntry={secureStates.next}
          style={styles.input}
          left={<TextInput.Icon icon="lock-plus-outline" />}
          right={
            <TextInput.Icon
              icon={secureStates.next ? 'eye-off-outline' : 'eye-outline'}
              onPress={() =>
                setSecureStates((prev) => ({ ...prev, next: !prev.next }))
              }
            />
          }
        />
        <HelperText type="error" visible={Boolean(errors.newPassword)}>
          {errors.newPassword}
        </HelperText>

        <TextInput
          label="Confirm new password"
          value={formData.confirmPassword}
          onChangeText={(value) => handleChange('confirmPassword', value)}
          onBlur={() => validateField('confirmPassword')}
          secureTextEntry={secureStates.confirm}
          style={styles.input}
          left={<TextInput.Icon icon="shield-lock-outline" />}
          right={
            <TextInput.Icon
              icon={secureStates.confirm ? 'eye-off-outline' : 'eye-outline'}
              onPress={() =>
                setSecureStates((prev) => ({ ...prev, confirm: !prev.confirm }))
              }
            />
          }
        />
        <HelperText type="error" visible={Boolean(errors.confirmPassword)}>
          {errors.confirmPassword}
        </HelperText>

        <Text
          variant="bodySmall"
          style={{ color: colors.textSecondary, marginTop: 8 }}
        >
          Recommended security additions
        </Text>
        <View style={styles.securityRow}>
          {(
            [
              { label: 'Rotate every 90 days', icon: 'history' },
              { label: 'Enable MFA', icon: 'key-chain-variant' },
            ] as const
          ).map((hint) => (
            <Chip
              key={hint.label}
              icon={hint.icon}
              style={{ backgroundColor: colors.surfaceVariant }}
              textStyle={{ color: colors.textSecondary }}
            >
              {hint.label}
            </Chip>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Switch
            value={formData.enableBiometric ?? false}
            onValueChange={(value) => handleChange('enableBiometric', value)}
            color={colors.primary}
          />
          <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
            Require biometric unlock on this device
          </Text>
        </View>

        <Button
          mode="contained"
          style={[
            styles.primaryButton,
            {
              backgroundColor: formIsValid
                ? colors.primary
                : colors.primaryLight,
            },
          ]}
          textColor={formIsValid ? colors.white : colors.textSecondary}
          disabled={!formIsValid}
          onPress={handleSubmit}
        >
          Update password
        </Button>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 18,
  },
  hero: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  formCard: {
    gap: 8,
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  securityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  primaryButton: {
    borderRadius: 16,
    marginTop: 6,
  },
});
