import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../api/client';
import { eventApi } from '../api/eventApi';
import { COLORS, FONTS } from '../constants/colors';
import { EventModel } from '../interfaces/models';

function imageUrl(path?: string) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${s.toLocaleDateString('en-GB', opts)} — ${e.toLocaleDateString('en-GB', opts)}`;
}

function isUpcoming(startDate: string) {
  return new Date(startDate) >= new Date();
}

function EventCard({ item, onPress }: { item: EventModel; onPress: () => void }) {
  const img = imageUrl(item.images?.[0]);
  const upcoming = isUpcoming(item.startDate);
  const start = new Date(item.startDate);
  const day = start.toLocaleDateString('en-GB', { day: 'numeric' });
  const month = start.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardLeft}>
        {/* Date Column */}
        <LinearGradient
          colors={upcoming ? [COLORS.primary, '#E91E8C'] : [COLORS.surface, COLORS.card]}
          style={styles.dateBox}
        >
          <Text style={[styles.dateDay, !upcoming && { color: COLORS.textMuted }]}>{day}</Text>
          <Text style={[styles.dateMonth, !upcoming && { color: COLORS.textMuted }]}>{month}</Text>
        </LinearGradient>
      </View>

      {img ? (
        <Image source={{ uri: img }} style={styles.cardImg} />
      ) : (
        <LinearGradient colors={[COLORS.card, COLORS.cardLight]} style={styles.cardImg}>
          <Ionicons name="calendar-outline" size={28} color={COLORS.textMuted} />
        </LinearGradient>
      )}

      <View style={styles.cardBody}>
        {upcoming && (
          <View style={styles.upcomingPill}>
            <Text style={styles.upcomingText}>Upcoming</Text>
          </View>
        )}
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.primary} />
          <Text style={styles.metaText} numberOfLines={1}>{item.city}, {item.country}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
          <Text style={[styles.metaText, { color: COLORS.textMuted }]} numberOfLines={1}>
            {formatDateRange(item.startDate, item.endDate)}
          </Text>
        </View>
      </View>

      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventApi.getAll(),
    select: (res) => res.data.result ?? [],
  });

  const filtered = (events ?? []).filter(
    (e) =>
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase()),
  );

  const upcoming = filtered.filter((e) => isUpcoming(e.startDate));
  const past = filtered.filter((e) => !isUpcoming(e.startDate));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <Text style={styles.headerSub}>
          {upcoming.length} upcoming · {past.length} past
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events or cities..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No events found</Text>
          <Text style={styles.emptyText}>
            {search ? 'Try a different search' : 'Check back soon for upcoming events'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <EventCard item={item} onPress={() => router.push(`/event/${item.id}` as any)} />
          )}
          contentContainerStyle={{ padding: 20, gap: 14 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            upcoming.length > 0 && past.length > 0 && !search ? (
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionLabel}>Upcoming</Text>
              </View>
            ) : null
          }
          ListFooterComponent={<View style={{ height: 10 }} />}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: FONTS.base, color: COLORS.textSub, marginTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: FONTS.md },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cardLeft: { justifyContent: 'center', alignItems: 'center' },
  dateBox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
    borderRadius: 12,
  },
  dateDay: { fontSize: FONTS.lg, fontWeight: '800', color: '#fff', lineHeight: 22 },
  dateMonth: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 1 },
  cardImg: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, padding: 12 },
  upcomingPill: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.accent}22`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  upcomingText: { fontSize: 10, color: COLORS.accent, fontWeight: '700' },
  cardName: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { fontSize: FONTS.sm, color: COLORS.textSub, flex: 1 },
  cardArrow: { paddingRight: 12 },
  sectionDivider: { marginBottom: 12 },
  sectionLabel: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: FONTS.base, color: COLORS.textSub },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: FONTS.base, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
