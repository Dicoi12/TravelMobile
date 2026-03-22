import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../api/client';
import { objectiveApi } from '../api/objectiveApi';
import { COLORS, FONTS } from '../constants/colors';
import { ObjectiveModel, ObjectiveType } from '../interfaces/models';

function imageUrl(path?: string) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

function RatingBadge({ value }: { value: number }) {
  return (
    <View style={styles.ratingBadge}>
      <Ionicons name="star" size={11} color={COLORS.star} />
      <Text style={styles.ratingText}>{value?.toFixed(1) ?? '—'}</Text>
    </View>
  );
}

function ObjectiveListCard({ item, onPress }: { item: ObjectiveModel; onPress: () => void }) {
  const img = imageUrl(item.images?.[0]);
  return (
    <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.88}>
      {img ? (
        <Image source={{ uri: img }} style={styles.listCardImg} />
      ) : (
        <LinearGradient colors={[COLORS.card, COLORS.cardLight]} style={styles.listCardImg}>
          <Ionicons name="image-outline" size={28} color={COLORS.textMuted} />
        </LinearGradient>
      )}
      <View style={styles.listCardBody}>
        <View style={styles.listCardTop}>
          <Text style={styles.listCardName} numberOfLines={1}>{item.name}</Text>
          <RatingBadge value={item.medieReview} />
        </View>
        {item.city && (
          <View style={styles.listCardRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.primary} />
            <Text style={styles.listCardMeta} numberOfLines={1}>{item.city}</Text>
          </View>
        )}
        {item.objectiveType && (
          <View style={styles.listCardTypePill}>
            <Text style={styles.listCardTypeText}>{item.objectiveType.name}</Text>
          </View>
        )}
        {item.description ? (
          <Text style={styles.listCardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.listCardFooter}>
          {item.formattedDistance ? (
            <View style={styles.listCardRow}>
              <Ionicons name="navigate-outline" size={13} color={COLORS.accent} />
              <Text style={[styles.listCardMeta, { color: COLORS.accent }]}>{item.formattedDistance}</Text>
            </View>
          ) : null}
          {item.pret && (
            <View style={styles.listCardRow}>
              <Ionicons name="pricetag-outline" size={13} color={COLORS.warning} />
              <Text style={[styles.listCardMeta, { color: COLORS.warning }]}>{item.pret}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then((loc) => setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }))
          .catch(() => setCoords({ latitude: 45.7983, longitude: 24.1256 }));
      } else {
        setCoords({ latitude: 45.7983, longitude: 24.1256 });
      }
    });
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  const typesQuery = useQuery({
    queryKey: ['objective-types'],
    queryFn: () => objectiveApi.getTypes(),
    select: (res) => res.data as ObjectiveType[],
  });

  const objectivesQuery = useQuery({
    queryKey: ['explore-objectives', coords, debouncedSearch, selectedType],
    queryFn: () =>
      objectiveApi.getLocal({
        latitude: coords!.latitude,
        longitude: coords!.longitude,
        maxDistance: 100,
        name: debouncedSearch || undefined,
        typeId: selectedType ?? undefined,
      }),
    enabled: !!coords,
    select: (res) => res.data.result ?? [],
  });

  const objectives: ObjectiveModel[] = objectivesQuery.data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSub}>
          {objectives.length > 0 ? `${objectives.length} places found` : 'Discover attractions near you'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search attractions..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filters */}
      {(typesQuery.data?.length ?? 0) > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedType === null && styles.filterChipActive]}
            onPress={() => setSelectedType(null)}
          >
            <Text style={[styles.filterChipText, selectedType === null && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {typesQuery.data!.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.filterChip, selectedType === type.id && styles.filterChipActive]}
              onPress={() => setSelectedType(selectedType === type.id ? null : type.id)}
            >
              <Text style={[styles.filterChipText, selectedType === type.id && styles.filterChipTextActive]}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results */}
      {objectivesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding attractions...</Text>
        </View>
      ) : objectives.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>Try a different search or adjust filters</Text>
        </View>
      ) : (
        <FlatList
          data={objectives}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ObjectiveListCard
              item={item}
              onPress={() => router.push(`/objective/${item.id}` as any)}
            />
          )}
          contentContainerStyle={{ padding: 20, gap: 14 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 10 }} />}
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
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: FONTS.md },
  filterScroll: { maxHeight: 48, marginBottom: 4 },
  filterChip: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: FONTS.sm, color: COLORS.textSub, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  listCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listCardImg: {
    width: 100,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCardBody: { flex: 1, padding: 14, justifyContent: 'space-between' },
  listCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  listCardName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text, flex: 1 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingText: { fontSize: FONTS.sm, color: COLORS.star, fontWeight: '700' },
  listCardRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  listCardMeta: { fontSize: FONTS.sm, color: COLORS.textSub },
  listCardTypePill: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}22`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  listCardTypeText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  listCardDesc: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 6, lineHeight: 18 },
  listCardFooter: { flexDirection: 'row', gap: 12, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: FONTS.base, color: COLORS.textSub, marginTop: 8 },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: FONTS.base, color: COLORS.textMuted, textAlign: 'center' },
});
