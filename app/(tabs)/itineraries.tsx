import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { itineraryApi } from '../api/itineraryApi';
import { COLORS, FONTS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { ItineraryPageDTO } from '../interfaces/models';

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysBetween(start: string | null, stop: string | null) {
  if (!start || !stop) return null;
  const diff = new Date(stop).getTime() - new Date(start).getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : null;
}

function ItineraryCard({ item, onPress, onDelete }: {
  item: ItineraryPageDTO;
  onPress: () => void;
  onDelete: () => void;
}) {
  const days = daysBetween(item.dataStart, item.dataStop);
  const stops = item.itineraryDetails?.length ?? 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <LinearGradient
        colors={[COLORS.card, COLORS.cardLight]}
        style={styles.cardGrad}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrap}>
            <LinearGradient colors={[COLORS.primary, '#E91E8C']} style={styles.cardIcon}>
              <Ionicons name="map" size={20} color="#fff" />
            </LinearGradient>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardDesc} numberOfLines={1}>{item.description || 'No description'}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardStats}>
          <StatChip icon="calendar-outline" label={formatDate(item.dataStart)} color={COLORS.accent} />
          {days && <StatChip icon="sunny-outline" label={`${days} day${days > 1 ? 's' : ''}`} color={COLORS.warning} />}
          <StatChip icon="location-outline" label={`${stops} stop${stops !== 1 ? 's' : ''}`} color={COLORS.primary} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function StatChip({ icon, label, color }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color: string }) {
  return (
    <View style={[styles.statChip, { borderColor: color + '44', backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

function CreateModal({ visible, onClose, onCreated }: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      itineraryApi.create({
        id: 0,
        name: name.trim(),
        description: description.trim(),
        idUser: user?.id ?? 0,
        dataStart: startDate || new Date().toISOString(),
        dataStop: endDate || new Date().toISOString(),
        itineraryDetails: [],
      }),
    onSuccess: (res) => {
      if (res.data.isSuccessful) {
        onCreated();
        setName('');
        setDescription('');
        setStartDate('');
        setEndDate('');
      } else {
        Alert.alert('Error', res.data.validationMessage ?? 'Failed to create trip.');
      }
    },
    onError: () => Alert.alert('Error', 'Failed to create trip. Please try again.'),
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>New Trip</Text>
        <Text style={styles.modalSub}>Plan your next adventure</Text>

        <InputRow icon="bookmark-outline" placeholder="Trip name *" value={name} onChangeText={setName} />
        <InputRow icon="document-text-outline" placeholder="Description" value={description} onChangeText={setDescription} multiline />
        <InputRow icon="calendar-outline" placeholder="Start date (e.g. 2026-06-01)" value={startDate} onChangeText={setStartDate} />
        <InputRow icon="calendar-outline" placeholder="End date (e.g. 2026-06-07)" value={endDate} onChangeText={setEndDate} />

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => { if (!name.trim()) { Alert.alert('Missing', 'Please enter a trip name.'); return; } mutation.mutate(); }}
          disabled={mutation.isPending}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[COLORS.primary, '#E91E8C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGrad}>
            {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Trip</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function InputRow({ icon, placeholder, value, onChangeText, multiline }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.inputWrap, multiline && { height: 80, alignItems: 'flex-start', paddingVertical: 12 }]}>
      <Ionicons name={icon} size={18} color={COLORS.textMuted} style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }} />
      <TextInput
        style={[styles.input, multiline && { height: 56 }]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export default function ItinerariesScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: itineraries, isLoading, refetch } = useQuery({
    queryKey: ['my-itineraries'],
    queryFn: () => itineraryApi.getMine(),
    select: (res) => res.data.result ?? [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => itineraryApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-itineraries'] }),
  });

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Trip', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Trips</Text>
          <Text style={styles.headerSub}>
            {itineraries?.length ?? 0} {(itineraries?.length ?? 0) === 1 ? 'trip' : 'trips'} planned
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
          <LinearGradient colors={[COLORS.primary, '#E91E8C']} style={styles.addBtnGrad}>
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your trips...</Text>
        </View>
      ) : (itineraries?.length ?? 0) === 0 ? (
        <View style={styles.center}>
          <LinearGradient colors={[COLORS.card, COLORS.cardLight]} style={styles.emptyIcon}>
            <Ionicons name="map-outline" size={48} color={COLORS.textMuted} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>Start planning your first adventure!</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
            <LinearGradient colors={[COLORS.primary, '#E91E8C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGrad}>
              <Text style={styles.emptyBtnText}>Plan a Trip</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={itineraries}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ItineraryCard
              item={item}
              onPress={() => router.push(`/itinerary/${item.id}` as any)}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          )}
          contentContainerStyle={{ padding: 20, gap: 14 }}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ListFooterComponent={<View style={{ height: 10 }} />}
        />
      )}

      <CreateModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          qc.invalidateQueries({ queryKey: ['my-itineraries'] });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: FONTS.base, color: COLORS.textSub, marginTop: 4 },
  addBtn: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  addBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  card: { borderRadius: 20, overflow: 'hidden' },
  cardGrad: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIconWrap: {},
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text },
  cardDesc: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  deleteBtn: { padding: 8 },
  cardStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statLabel: { fontSize: FONTS.sm, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: FONTS.base, color: COLORS.textSub },
  emptyIcon: { width: 96, height: 96, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: FONTS.base, color: COLORS.textMuted },
  emptyBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  emptyBtnGrad: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.md },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  modalSub: { fontSize: FONTS.base, color: COLORS.textSub, marginBottom: 20 },
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
  createBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  createBtnGrad: { borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
});
