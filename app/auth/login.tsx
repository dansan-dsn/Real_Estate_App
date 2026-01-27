import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  Switch,
  HelperText,
  Chip,
} from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { z } from 'zod';
import { useThemeStore } from '@/stores/useTheme';
import GlassCard from '@/components/ui/GlassCard';
import { authService } from '@/services/auth';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must include at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export default function LoginScreen() {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [errors, setErrors] = useState<
    Partial<Record<'email' | 'password', string>>
  >({});
  const [loading, setLoading] = useState(false);
  const { colors } = useThemeStore();
  const router = useRouter();

  const validateField = (field: 'email' | 'password', value: string) => {
    const result = loginSchema.shape[field].safeParse(value);
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const handleChange = (field: keyof LoginForm, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'email' || field === 'password') {
      validateField(field, value as string);
    }
  };

  const formIsValid = useMemo(
    () => loginSchema.safeParse(formData).success,
    [formData]
  );

  const handleLogin = async () => {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<'email' | 'password', string>> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (key === 'email' || key === 'password') {
          fieldErrors[key] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const authResponse = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      Alert.alert(
        'Welcome back!',
        `Successfully logged in as ${authResponse.user.firstName} ${authResponse.user.lastName}`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
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
          name="home-analytics"
          size={32}
          color={colors.primary}
        />
        <Text
          variant="headlineSmall"
          style={{ color: colors.primary, marginTop: 8 }}
        >
          EstateOS Control Room
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: colors.textSecondary,
            marginTop: 6,
            textAlign: 'center',
          }}
        >
          Sign in to manage portfolios, tenants, and analytics in a single
          modern workspace.
        </Text>
      </View>

      <GlassCard style={styles.formCard}>
        <Text
          variant="titleMedium"
          style={{ color: colors.text, marginBottom: 12 }}
        >
          Credentials
        </Text>

        <TextInput
          label="Email address"
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          onBlur={() => validateField('email', formData.email)}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          left={<TextInput.Icon icon="email-outline" />}
        />
        <HelperText type="error" visible={Boolean(errors.email)}>
          {errors.email}
        </HelperText>

        <TextInput
          label="Password"
          value={formData.password}
          onChangeText={(value) => handleChange('password', value)}
          onBlur={() => validateField('password', formData.password)}
          secureTextEntry={secureTextEntry}
          style={styles.input}
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon
              icon={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setSecureTextEntry((prev) => !prev)}
            />
          }
        />
        <HelperText type="error" visible={Boolean(errors.password)}>
          {errors.password}
        </HelperText>

        <View style={styles.rememberRow}>
          <Switch
            value={formData.rememberMe ?? false}
            onValueChange={(value) => handleChange('rememberMe', value)}
            color={colors.primary}
            trackColor={{
              false: colors.textSecondary,
              true: colors.primaryDark,
            }}
            thumbColor={
              (formData.rememberMe ?? false)
                ? colors.primary
                : colors.primaryLight
            }
          />
          <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
            Remember this device
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
          disabled={!formIsValid || loading}
          loading={loading}
          onPress={handleLogin}
        >
          Sign in
        </Button>

        <Button
          mode="text"
          onPress={() => router.push('/auth/forgot-password')}
          labelStyle={{ color: colors.primary }}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        >
          Forgot your password?
        </Button>
      </GlassCard>

      <GlassCard style={styles.secondaryCard} intensity={20} borderless>
        <Text
          variant="titleSmall"
          style={{ color: colors.text, marginBottom: 12 }}
        >
          Continue with
        </Text>
        <Button
          mode="outlined"
          icon="google"
          style={[styles.socialButton, { borderColor: '#4285F4' }]}
          labelStyle={{ color: '#4285F4' }}
          onPress={() =>
            Alert.alert(
              'Google Sign-In',
              'Google authentication will be available soon.'
            )
          }
        >
          Google
        </Button>
        <Chip
          icon="shield-key-outline"
          style={{ marginTop: 12, backgroundColor: colors.surfaceVariant }}
          textStyle={{ color: colors.textSecondary }}
        >
          Enterprise SSO available for agency partners
        </Chip>
      </GlassCard>

      <View style={styles.footer}>
        <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
          New to EstateOS?
        </Text>
        <Button
          mode="text"
          labelStyle={{ color: colors.primary }}
          onPress={() => router.push('/auth/signup')}
        >
          Create an account
        </Button>
      </View>
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 16,
  },
  socialButton: {
    marginVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  secondaryCard: {
    gap: 8,
  },
});
