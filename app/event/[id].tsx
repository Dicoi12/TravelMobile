import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../api/client';
import { eventApi } from '../api/eventApi';
import { COLORS, FONTS } from '../constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');

function imageUrl(path?: string) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function InfoPill({ icon, text, color = COLORS.textSub }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  color?: string;
}) {
  return (
    <View style={[styles.infoPill, { borderColor: color + '44', backgroundColor: color + '18' }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.infoPillText, { color }]}>{text}</Text>
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [imgIndex, setImgIndex] = useState(0);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventApi.getById(Number(id)),
    select: (res) => res.data.result,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = event.images?.filter(Boolean) ?? [];
  const hasImages = images.length > 0;
  const isUpcoming = new Date(event.startDate) >= new Date();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.carousel}>
          {hasImages ? (
            <>
              <FlatList
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onMomentumScrollEnd={(e) =>
                  setImgIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
                }
                renderItem={({ item }) => {
                  const uri = imageUrl(item);
                  return uri ? (
                    <Image source={{ uri }} style={styles.carouselImg} />
                  ) : (
                    <LinearGradient
                      colors={[COLORS.card, COLORS.cardLight]}
                      style={styles.carouselImg}
                    >
                      <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
                    </LinearGradient>
                  );
                }}
              />
              {images.length > 1 && (
                <View style={styles.dots}>
                  {images.map((_, i) => (
                    <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <LinearGradient
              colors={[COLORS.primary + '44', COLORS.card]}
              style={styles.carouselPlaceholder}
            >
              <Ionicons name="calendar-outline" size={64} color={COLORS.primary} />
              <Text style={{ color: COLORS.textSub, marginTop: 12, fontSize: FONTS.base }}>
                No images available
              </Text>
            </LinearGradient>
          )}

          {/* Status badge */}
          <View style={[styles.statusBadge, isUpcoming ? styles.statusUpcoming : styles.statusPast]}>
            <Text style={styles.statusText}>{isUpcoming ? 'Upcoming' : 'Past Event'}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.name}>{event.name}</Text>

          {/* Pills row */}
          <View style={styles.pillsRow}>
            <InfoPill icon="location-outline" text={`${event.city}, ${event.country}`} color={COLORS.primary} />
            {isUpcoming && (
              <InfoPill icon="checkmark-circle-outline" text="Open to attend" color={COLORS.success} />
            )}
          </View>

          {/* Date Card */}
          <View style={styles.dateCard}>
            <LinearGradient
              colors={isUpcoming ? [COLORS.primary, '#E91E8C'] : [COLORS.surface, COLORS.card]}
              style={styles.dateCardGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.dateBlock}>
                <Ionicons name="play-outline" size={16} color={isUpcoming ? '#fff' : COLORS.textSub} />
                <View>
                  <Text style={[styles.dateLabel, !isUpcoming && { color: COLORS.textMuted }]}>Starts</Text>
                  <Text style={[styles.dateValue, !isUpcoming && { color: COLORS.textSub }]}>
                    {formatDate(event.startDate)}
                  </Text>
                </View>
              </View>
              <View style={[styles.dateSep, !isUpcoming && { backgroundColor: COLORS.border }]} />
              <View style={styles.dateBlock}>
                <Ionicons name="stop-outline" size={16} color={isUpcoming ? '#fff' : COLORS.textSub} />
                <View>
                  <Text style={[styles.dateLabel, !isUpcoming && { color: COLORS.textMuted }]}>Ends</Text>
                  <Text style={[styles.dateValue, !isUpcoming && { color: COLORS.textSub }]}>
                    {formatDate(event.endDate)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>About this Event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* Linked Objective */}
          {event.objective && (
            <View style={styles.linkedSection}>
              <Text style={styles.sectionTitle}>Linked Attraction</Text>
              <TouchableOpacity
                style={styles.linkedCard}
                onPress={() => router.push(`/objective/${event.objective!.id}` as any)}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={[COLORS.card, COLORS.cardLight]}
                  style={styles.linkedCardGrad}
                >
                  <View style={styles.linkedIconWrap}>
                    <LinearGradient colors={[COLORS.primary, '#E91E8C']} style={styles.linkedIcon}>
                      <Ionicons name="business-outline" size={20} color="#fff" />
                    </LinearGradient>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.linkedName}>{event.objective.name}</Text>
                    {event.objective.city && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="location-outline" size={13} color={COLORS.primary} />
                        <Text style={styles.linkedCity}>{event.objective.city}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: COLORS.background },
  errorText: { fontSize: FONTS.lg, color: COLORS.text, fontWeight: '600' },
  carousel: { height: 280, backgroundColor: COLORS.card },
  carouselImg: { width: SCREEN_W, height: 280, resizeMode: 'cover' },
  carouselPlaceholder: {
    width: SCREEN_W,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 18, backgroundColor: '#fff' },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusUpcoming: { backgroundColor: `${COLORS.success}dd` },
  statusPast: { backgroundColor: 'rgba(0,0,0,0.6)' },
  statusText: { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },
  content: { padding: 20 },
  name: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.text, marginBottom: 12, lineHeight: 34 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  infoPillText: { fontSize: FONTS.sm, fontWeight: '600' },
  dateCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 24 },
  dateCardGrad: { padding: 16, borderRadius: 18 },
  dateBlock: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 },
  dateLabel: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  dateValue: { fontSize: FONTS.base, color: '#fff', fontWeight: '600' },
  descSection: { marginBottom: 24 },
  sectionTitle: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  description: { fontSize: FONTS.base, color: COLORS.textSub, lineHeight: 24 },
  linkedSection: { marginBottom: 24 },
  linkedCard: { borderRadius: 18, overflow: 'hidden' },
  linkedCardGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkedIconWrap: {},
  linkedIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedName: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text },
  linkedCity: { fontSize: FONTS.sm, color: COLORS.textSub },
});
