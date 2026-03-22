import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../api/client';
import { eventApi } from '../api/eventApi';
import { objectiveApi } from '../api/objectiveApi';
import { COLORS, FONTS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { EventModel, ObjectiveModel } from '../interfaces/models';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function imageUrl(path: string | undefined) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Ionicons name="star" size={12} color={COLORS.star} />
      <Text style={{ color: COLORS.star, fontSize: FONTS.sm, fontWeight: '700' }}>
        {rating?.toFixed(1) ?? '—'}
      </Text>
    </View>
  );
}

function ObjectiveCard({ item, onPress }: { item: ObjectiveModel; onPress: () => void }) {
  const img = imageUrl(item.images?.[0]);
  return (
    <TouchableOpacity style={styles.objectiveCard} onPress={onPress} activeOpacity={0.88}>
      {img ? (
        <Image source={{ uri: img }} style={styles.cardImg} />
      ) : (
        <LinearGradient colors={[COLORS.card, COLORS.cardLight]} style={styles.cardImg}>
          <Ionicons name="image-outline" size={32} color={COLORS.textMuted} />
        </LinearGradient>
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardOverlay} />
      <View style={styles.cardBottom}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.cardMeta}>
          <StarRow rating={item.medieReview} />
          {item.formattedDistance ? (
            <Text style={styles.cardDist}>{item.formattedDistance}</Text>
          ) : null}
        </View>
      </View>
      {item.objectiveType && (
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{item.objectiveType.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function EventCard({ item, onPress }: { item: EventModel; onPress: () => void }) {
  const img = imageUrl(item.images?.[0]);
  const start = new Date(item.startDate);
  const dateStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.88}>
      {img ? (
        <Image source={{ uri: img }} style={styles.eventImg} />
      ) : (
        <LinearGradient colors={[COLORS.card, COLORS.cardLight]} style={styles.eventImg}>
          <Ionicons name="calendar-outline" size={28} color={COLORS.textMuted} />
        </LinearGradient>
      )}
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="location-outline" size={13} color={COLORS.primary} />
          <Text style={styles.eventCity} numberOfLines={1}>{item.city}, {item.country}</Text>
        </View>
        <View style={[styles.eventMeta, { marginTop: 4 }]}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.accent} />
          <Text style={[styles.eventCity, { color: COLORS.accent }]}>{dateStr}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const CATEGORIES = [
  { label: 'Monuments', icon: 'business-outline', color: '#FF6B35' },
  { label: 'Museums', icon: 'library-outline', color: '#9C27B0' },
  { label: 'Nature', icon: 'leaf-outline', color: '#4CAF50' },
  { label: 'Trails', icon: 'walk-outline', color: '#2196F3' },
  { label: 'Panoramic', icon: 'telescope-outline', color: '#00BCD4' },
  { label: 'Historic', icon: 'time-outline', color: '#FF9800' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then((loc) =>
            setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
          )
          .catch(() => setCoords({ latitude: 45.7983, longitude: 24.1256 }));
      } else {
        setCoords({ latitude: 45.7983, longitude: 24.1256 });
      }
    });
  }, []);

  const objectivesQuery = useQuery({
    queryKey: ['home-objectives', coords?.latitude, coords?.longitude],
    queryFn: () =>
      objectiveApi.getLocal({
        latitude: coords!.latitude,
        longitude: coords!.longitude,
        maxDistance: 50,
      }),
    enabled: !!coords,
    select: (res) => res.data.result?.slice(0, 10) ?? [],
  });

  const eventsQuery = useQuery({
    queryKey: ['home-events'],
    queryFn: () => eventApi.getAll(),
    select: (res) => res.data.result?.slice(0, 8) ?? [],
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([objectivesQuery.refetch(), eventsQuery.refetch()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.username}>{user?.userName ?? 'Traveler'} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <LinearGradient
              colors={[COLORS.primary, '#E91E8C']}
              style={styles.avatarGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarInitial}>
                {(user?.userName?.[0] ?? '?').toUpperCase()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={[COLORS.primary, '#E91E8C', '#9C27B0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGrad}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Discover{'\n'}New Places</Text>
              <Text style={styles.heroSub}>
                {coords ? 'Showing attractions near you' : 'Loading your location...'}
              </Text>
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <Text style={styles.heroBtnText}>Explore Now</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.heroIconWrap}>
              <Ionicons name="globe-outline" size={96} color="rgba(255,255,255,0.15)" />
            </View>
          </LinearGradient>
        </View>

        {/* Quick Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={styles.catChip}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[cat.color + '33', cat.color + '11']}
                  style={styles.catChipGrad}
                >
                  <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                  <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Nearby Attractions */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Nearby Attractions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {objectivesQuery.isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (objectivesQuery.data?.length ?? 0) === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No attractions found nearby</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {objectivesQuery.data!.map((item) => (
                <ObjectiveCard
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/objective/${item.id}` as any)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {eventsQuery.isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (eventsQuery.data?.length ?? 0) === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No upcoming events</Text>
            </View>
          ) : (
            <View style={styles.eventList}>
              {eventsQuery.data!.map((item) => (
                <EventCard
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/event/${item.id}` as any)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
    paddingBottom: 8,
  },
  greeting: { fontSize: FONTS.base, color: COLORS.textSub },
  username: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  avatarGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  avatarInitial: { fontSize: FONTS.lg, fontWeight: '800', color: '#fff' },
  heroBanner: { marginHorizontal: 20, marginTop: 16, borderRadius: 20, overflow: 'hidden' },
  heroGrad: {
    borderRadius: 20,
    padding: 24,
    minHeight: 160,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroContent: { flex: 1 },
  heroTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: '#fff', lineHeight: 36 },
  heroSub: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)', marginTop: 6, marginBottom: 16 },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  heroBtnText: { color: COLORS.primary, fontSize: FONTS.base, fontWeight: '700' },
  heroIconWrap: { position: 'absolute', right: -16, bottom: -16 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: FONTS.base, color: COLORS.primary, fontWeight: '600' },
  catScroll: { marginLeft: -4 },
  catChip: { marginRight: 10, borderRadius: 16, overflow: 'hidden' },
  catChipGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  catLabel: { fontSize: FONTS.sm, fontWeight: '600' },
  hScroll: { marginLeft: -4 },
  objectiveCard: {
    width: 200,
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: COLORS.card,
  },
  cardImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOverlay: { ...StyleSheet.absoluteFillObject },
  cardBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  cardName: { fontSize: FONTS.base, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDist: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.7)' },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,107,53,0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  eventList: { gap: 12 },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventImg: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  eventName: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventCity: { fontSize: FONTS.sm, color: COLORS.textSub },
  loader: { height: 80, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: FONTS.base, color: COLORS.textMuted },
});
