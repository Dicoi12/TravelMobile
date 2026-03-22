import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../api/client';
import { itineraryApi } from '../api/itineraryApi';
import { objectiveApi } from '../api/objectiveApi';
import { COLORS, FONTS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { ItineraryDetailModel, ObjectiveModel } from '../interfaces/models';

function imageUrl(path?: string) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StopCard({ detail, order, onDelete }: {
  detail: ItineraryDetailModel;
  order: number;
  onDelete: () => void;
}) {
  const router = useRouter();
  const img = imageUrl(detail.objective?.images?.[0] ?? detail.images?.[0]);

  return (
    <View style={styles.stopCard}>
      {/* Timeline connector */}
      <View style={styles.timelineCol}>
        <LinearGradient colors={[COLORS.primary, '#E91E8C']} style={styles.orderBadge}>
          <Text style={styles.orderNum}>{order}</Text>
        </LinearGradient>
        <View style={styles.timelineLine} />
      </View>

      <View style={styles.stopBody}>
        <View style={styles.stopCardInner}>
          {img ? (
            <Image source={{ uri: img }} style={styles.stopImg} />
          ) : (
            <LinearGradient colors={[COLORS.card, COLORS.cardLight]} style={styles.stopImg}>
              <Ionicons name="location-outline" size={22} color={COLORS.textMuted} />
            </LinearGradient>
          )}
          <View style={styles.stopInfo}>
            <Text style={styles.stopName} numberOfLines={1}>{detail.name}</Text>
            {detail.descriere ? (
              <Text style={styles.stopDesc} numberOfLines={2}>{detail.descriere}</Text>
            ) : null}
            <View style={styles.stopMeta}>
              {detail.date && (
                <View style={styles.stopMetaItem}>
                  <Ionicons name="time-outline" size={12} color={COLORS.accent} />
                  <Text style={[styles.stopMetaText, { color: COLORS.accent }]}>
                    {new Date(detail.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
              {detail.estimatedTime && (
                <View style={styles.stopMetaItem}>
                  <Ionicons name="hourglass-outline" size={12} color={COLORS.warning} />
                  <Text style={[styles.stopMetaText, { color: COLORS.warning }]}>
                    {detail.estimatedTime}h
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.stopActions}>
            {detail.idObjective && (
              <TouchableOpacity
                onPress={() => router.push(`/objective/${detail.idObjective}` as any)}
                style={styles.stopActionBtn}
              >
                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onDelete} style={styles.stopActionBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function AddStopModal({ visible, itineraryId, currentCount, onClose, onAdded }: {
  visible: boolean;
  itineraryId: number;
  currentCount: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [search, setSearch] = useState('');
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveModel | null>(null);

  const objectivesQuery = useQuery({
    queryKey: ['objectives-search', search],
    queryFn: () => objectiveApi.getAll(search || undefined, 1, 10),
    select: (res) => res.data.result?.items ?? [],
    enabled: search.length > 0,
  });

  const mutation = useMutation({
    mutationFn: () =>
      itineraryApi.addDetail({
        id: 0,
        idItinerary: itineraryId,
        idObjective: selectedObjective?.id ?? null,
        name: name.trim() || selectedObjective?.name || 'Stop',
        descriere: desc.trim() || undefined,
        visitOrder: currentCount + 1,
        estimatedTime: estimatedTime ? parseFloat(estimatedTime) : undefined,
      }),
    onSuccess: () => {
      onAdded();
      setName(''); setDesc(''); setEstimatedTime(''); setSearch(''); setSelectedObjective(null);
    },
    onError: () => Alert.alert('Error', 'Could not add stop.'),
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Add Stop</Text>

        {/* Search Objective */}
        <Text style={styles.fieldLabel}>Link to attraction (optional)</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Search attractions..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={(t) => { setSearch(t); setSelectedObjective(null); }}
          />
        </View>

        {selectedObjective ? (
          <View style={styles.selectedObj}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.selectedObjText}>{selectedObjective.name}</Text>
            <TouchableOpacity onPress={() => setSelectedObjective(null)}>
              <Ionicons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ) : search.length > 0 && (objectivesQuery.data?.length ?? 0) > 0 ? (
          <View style={styles.suggestionList}>
            {objectivesQuery.data!.slice(0, 4).map((obj) => (
              <TouchableOpacity
                key={obj.id}
                style={styles.suggestionItem}
                onPress={() => { setSelectedObjective(obj); setName(obj.name); setSearch(''); }}
              >
                <Text style={styles.suggestionText}>{obj.name}</Text>
                {obj.city && <Text style={styles.suggestionCity}>{obj.city}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Stop name *</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="location-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Lunch at market"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <View style={[styles.inputWrap, { height: 70, alignItems: 'flex-start', paddingVertical: 10 }]}>
          <TextInput
            style={[styles.input, { height: 50 }]}
            placeholder="Any notes..."
            placeholderTextColor={COLORS.textMuted}
            value={desc}
            onChangeText={setDesc}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.fieldLabel}>Estimated hours (optional)</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="hourglass-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="e.g. 1.5"
            placeholderTextColor={COLORS.textMuted}
            value={estimatedTime}
            onChangeText={setEstimatedTime}
            keyboardType="decimal-pad"
          />
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { if (!name.trim() && !selectedObjective) { Alert.alert('Missing', 'Please enter a stop name.'); return; } mutation.mutate(); }}
          disabled={mutation.isPending}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[COLORS.primary, '#E91E8C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtnGrad}>
            {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>Add Stop</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function ItineraryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [showAddStop, setShowAddStop] = useState(false);

  const { data: itinerary, isLoading } = useQuery({
    queryKey: ['itinerary', id],
    queryFn: () => itineraryApi.getById(Number(id)),
    select: (res) => res.data.result,
  });

  const deleteDetailMutation = useMutation({
    mutationFn: (detailId: number) => itineraryApi.deleteDetail(detailId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['itinerary', id] }),
  });

  const handleDeleteDetail = (detailId: number, name: string) => {
    Alert.alert('Remove Stop', `Remove "${name}" from this trip?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteDetailMutation.mutate(detailId) },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!itinerary) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }

  const details = [...(itinerary.itineraryDetails ?? [])].sort(
    (a, b) => a.visitOrder - b.visitOrder,
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={[COLORS.primary, '#E91E8C', '#9C27B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <LinearGradient colors={[COLORS.primary, '#E91E8C']} style={styles.heroIcon}>
            <Ionicons name="map" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.heroName}>{itinerary.name}</Text>
          {itinerary.description ? (
            <Text style={styles.heroDesc}>{itinerary.description}</Text>
          ) : null}

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{formatDate(itinerary.dataStart)}</Text>
            </View>
            <View style={styles.heroStatSep} />
            <View style={styles.heroStat}>
              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{formatDate(itinerary.dataStop)}</Text>
            </View>
            <View style={styles.heroStatSep} />
            <View style={styles.heroStat}>
              <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{details.length} stop{details.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stops Section */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Itinerary</Text>
            <TouchableOpacity
              style={styles.addStopBtn}
              onPress={() => setShowAddStop(true)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[COLORS.primary, '#E91E8C']} style={styles.addStopGrad}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addStopText}>Add Stop</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {details.length === 0 ? (
            <View style={styles.emptyStops}>
              <LinearGradient colors={[COLORS.card, COLORS.cardLight]} style={styles.emptyIcon}>
                <Ionicons name="location-outline" size={40} color={COLORS.textMuted} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No stops yet</Text>
              <Text style={styles.emptyText}>Add your first destination to plan your route</Text>
            </View>
          ) : (
            <View style={styles.stopsList}>
              {details.map((detail, index) => (
                <StopCard
                  key={detail.id}
                  detail={detail}
                  order={index + 1}
                  onDelete={() => handleDeleteDetail(detail.id, detail.name)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <AddStopModal
        visible={showAddStop}
        itineraryId={itinerary.id}
        currentCount={details.length}
        onClose={() => setShowAddStop(false)}
        onAdded={() => {
          setShowAddStop(false);
          qc.invalidateQueries({ queryKey: ['itinerary', id] });
          qc.invalidateQueries({ queryKey: ['my-itineraries'] });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: COLORS.background },
  errorText: { fontSize: FONTS.lg, color: COLORS.text, fontWeight: '600' },
  hero: {
    padding: 24,
    paddingTop: 28,
    paddingBottom: 32,
    alignItems: 'center',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  heroName: { fontSize: FONTS.xxl, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  heroDesc: { fontSize: FONTS.base, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatText: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  heroStatSep: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 12 },
  content: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text },
  addStopBtn: { borderRadius: 12, overflow: 'hidden' },
  addStopGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addStopText: { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },
  emptyStops: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIcon: { width: 88, height: 88, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: FONTS.base, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 20 },
  stopsList: {},
  stopCard: { flexDirection: 'row', marginBottom: 4 },
  timelineCol: { alignItems: 'center', marginRight: 14, paddingTop: 2 },
  orderBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  orderNum: { color: '#fff', fontSize: FONTS.sm, fontWeight: '800' },
  timelineLine: { flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: 6, marginBottom: -4, minHeight: 20 },
  stopBody: { flex: 1, marginBottom: 16 },
  stopCardInner: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  stopImg: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  stopInfo: { flex: 1, padding: 12 },
  stopName: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  stopDesc: { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 4, lineHeight: 18 },
  stopMeta: { flexDirection: 'row', gap: 10 },
  stopMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  stopMetaText: { fontSize: FONTS.sm, fontWeight: '600' },
  stopActions: { paddingRight: 12, gap: 8, alignItems: 'center' },
  stopActionBtn: { padding: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    maxHeight: '90%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  fieldLabel: { fontSize: FONTS.sm, color: COLORS.textSub, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 4,
  },
  input: { flex: 1, color: COLORS.text, fontSize: FONTS.base },
  selectedObj: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${COLORS.success}18`,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: `${COLORS.success}44`,
  },
  selectedObjText: { flex: 1, fontSize: FONTS.base, color: COLORS.text, fontWeight: '500' },
  suggestionList: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  suggestionText: { fontSize: FONTS.base, color: COLORS.text, fontWeight: '500' },
  suggestionCity: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  addBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  addBtnGrad: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  addBtnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
});
