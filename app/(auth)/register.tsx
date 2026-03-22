import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authApi } from '../api/authApi';
import { COLORS, FONTS } from '../constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      authApi.signUp({ userName: userName.trim(), email: email.trim(), password, phone: phone.trim() || undefined }),
    onSuccess: (res) => {
      if (res.data.isSuccessful) {
        Alert.alert('Account Created', 'You can now sign in with your credentials.', [
          { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
        ]);
      } else {
        Alert.alert('Registration Failed', res.data.validationMessage ?? 'Please try again.');
      }
    },
    onError: (error: any) => {
      Alert.alert(
        'Registration Failed',
        error?.response?.data?.validationMessage || error?.response?.data?.message || 'Something went wrong.',
      );
    },
  });

  const handleRegister = () => {
    if (!userName.trim() || !email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0F1929', '#1a1035', '#0F1929']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[COLORS.primary, '#E91E8C']}
            style={styles.logoCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="airplane" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>TravelS</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join millions of travelers worldwide</Text>

          <InputField
            icon="person-outline"
            placeholder="Username *"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="none"
          />
          <InputField
            icon="mail-outline"
            placeholder="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            icon="call-outline"
            placeholder="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <InputField
            icon="lock-closed-outline"
            placeholder="Password * (min 6 chars)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            }
          />
          <InputField
            icon="lock-closed-outline"
            placeholder="Confirm password *"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPass}
          />

          <TouchableOpacity onPress={handleRegister} disabled={mutation.isPending} activeOpacity={0.85}>
            <LinearGradient
              colors={[COLORS.primary, '#E91E8C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightIcon,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  rightIcon?: React.ReactNode;
}) {
  return (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color={COLORS.textMuted} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, rightIcon ? { flex: 1 } : {}]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
      />
      {rightIcon}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,107,53,0.1)',
    top: -60,
    right: -60,
  },
  orb2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(233,30,140,0.08)',
    bottom: 60,
    left: -40,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  appName: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: FONTS.base, color: COLORS.textSub, marginBottom: 24 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.text, fontSize: FONTS.md },
  btn: {
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700', letterSpacing: 0.5 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: COLORS.textSub, fontSize: FONTS.base },
  loginLink: { color: COLORS.primary, fontSize: FONTS.base, fontWeight: '700' },
});
