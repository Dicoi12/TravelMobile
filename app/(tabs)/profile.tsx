import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../api/authApi';
import { itineraryApi } from '../api/itineraryApi';
import { COLORS, FONTS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

function Avatar({ name }: { name: string }) {
  const initial = (name?.[0] ?? '?').toUpperCase();
  return (
    <LinearGradient
      colors={[COLORS.primary, '#E91E8C']}
      style={styles.avatar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.avatarText}>{initial}</Text>
    </LinearGradient>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  value,
  danger,
  rightIcon = 'chevron-forward',
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  value?: string;
  danger?: boolean;
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingsIcon, danger && { backgroundColor: `${COLORS.danger}20` }]}>
        <Ionicons name={icon} size={20} color={danger ? COLORS.danger : COLORS.primary} />
      </View>
      <View style={styles.settingsLabel}>
        <Text style={[styles.settingsText, danger && { color: COLORS.danger }]}>{label}</Text>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
      </View>
      <Ionicons name={rightIcon} size={18} color={danger ? COLORS.danger : COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function ChangePasswordModal({ visible, userId, onClose }: {
  visible: boolean;
  userId: number;
  onClose: () => void;
}) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword({ userId, oldPassword: oldPass, newPassword: newPass }),
    onSuccess: () => {
      Alert.alert('Success', 'Password updated successfully.');
      onClose();
      setOldPass(''); setNewPass(''); setConfirm('');
    },
    onError: (err: any) =>
      Alert.alert('Failed', err?.response?.data?.validationMessage ?? 'Could not change password.'),
  });

  const handleSubmit = () => {
    if (!oldPass || !newPass || !confirm) { Alert.alert('Missing Fields'); return; }
    if (newPass.length < 6) { Alert.alert('Weak Password', 'Minimum 6 characters.'); return; }
    if (newPass !== confirm) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    mutation.mutate();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Change Password</Text>

        {[
          { placeholder: 'Current password', value: oldPass, setter: setOldPass },
          { placeholder: 'New password (min 6)', value: newPass, setter: setNewPass },
          { placeholder: 'Confirm new password', value: confirm, setter: setConfirm },
        ].map(({ placeholder, value, setter }) => (
          <View key={placeholder} style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor={COLORS.textMuted}
              value={value}
              onChangeText={setter}
              secureTextEntry
            />
          </View>
        ))}

        <TouchableOpacity style={styles.sheetBtn} onPress={handleSubmit} disabled={mutation.isPending} activeOpacity={0.85}>
          <LinearGradient colors={[COLORS.primary, '#E91E8C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sheetBtnGrad}>
            {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sheetBtnText}>Update Password</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showPassModal, setShowPassModal] = useState(false);

  const { data: itineraries } = useQuery({
    queryKey: ['my-itineraries'],
    queryFn: () => itineraryApi.getMine(),
    select: (res) => res.data.result ?? [],
  });

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={[COLORS.surface, COLORS.background]}
          style={styles.profileHeader}
        >
          <Avatar name={user?.userName ?? '?'} />
          <Text style={styles.userName}>{user?.userName ?? 'Traveler'}</Text>
          {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{user?.role === 1 ? '⭐ Administrator' : 'Explorer'}</Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox value={itineraries?.length ?? 0} label="Trips" icon="map" />
          <View style={styles.statsDivider} />
          <StatBox
            value={itineraries?.reduce((acc, it) => acc + (it.itineraryDetails?.length ?? 0), 0) ?? 0}
            label="Stops"
            icon="location"
          />
          <View style={styles.statsDivider} />
          <StatBox value={user?.role === 1 ? 'Admin' : 'User'} label="Role" icon="shield" />
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <SettingsRow icon="person-outline" label="Username" value={user?.userName} />
            <View style={styles.separator} />
            <SettingsRow icon="mail-outline" label="Email" value={user?.email ?? 'Not set'} />
            <View style={styles.separator} />
            <SettingsRow icon="lock-closed-outline" label="Change Password" onPress={() => setShowPassModal(true)} />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.settingsCard}>
            <SettingsRow icon="map-outline" label="My Trips" onPress={() => router.push('/(tabs)/itineraries')} />
            <View style={styles.separator} />
            <SettingsRow icon="compass-outline" label="Explore Attractions" onPress={() => router.push('/(tabs)/explore')} />
            <View style={styles.separator} />
            <SettingsRow icon="calendar-outline" label="Events" onPress={() => router.push('/(tabs)/events')} />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              danger
              rightIcon="chevron-forward"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>TravelS • v1.0.0</Text>
        </View>
      </ScrollView>

      {user && (
        <ChangePasswordModal
          visible={showPassModal}
          userId={user.id}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </SafeAreaView>
  );
}

function StatBox({ value, label, icon }: {
  value: string | number;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={18} color={COLORS.primary} style={{ marginBottom: 6 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  userName: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  userEmail: { fontSize: FONTS.base, color: COLORS.textSub, marginBottom: 10 },
  rolePill: {
    backgroundColor: `${COLORS.primary}22`,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${COLORS.primary}44`,
  },
  roleText: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statsDivider: { width: 1, backgroundColor: COLORS.border },
  statValue: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  statLabel: { fontSize: FONTS.sm, color: COLORS.textMuted },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textSub, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  settingsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsLabel: { flex: 1 },
  settingsText: { fontSize: FONTS.base, color: COLORS.text, fontWeight: '500' },
  settingsValue: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 66 },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: FONTS.sm, color: COLORS.textMuted },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
  },
  input: { flex: 1, color: COLORS.text, fontSize: FONTS.base },
  sheetBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  sheetBtnGrad: { borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  sheetBtnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
});
