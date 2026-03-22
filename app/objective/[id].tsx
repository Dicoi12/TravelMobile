import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { reviewApi } from '../api/reviewApi';
import { COLORS, FONTS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { ReviewModel } from '../interfaces/models';

const { width: SCREEN_W } = Dimensions.get('window');

function imageUrl(path?: string) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.round(value) ? 'star' : 'star-outline'}
          size={size}
          color={COLORS.star}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: ReviewModel }) {
  const date = new Date(review.datePosted).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <LinearGradient colors={[COLORS.primary, '#E91E8C']} style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>
            {(review.user?.userName?.[0] ?? '?').toUpperCase()}
          </Text>
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.reviewName}>{review.user?.userName ?? `User ${review.idUser}`}</Text>
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
        <StarRating value={review.raiting} size={13} />
      </View>
      {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
    </View>
  );
}

function InfoRow({ icon, label, value, color = COLORS.textSub }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function ObjectiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [imgIndex, setImgIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: objective, isLoading } = useQuery({
    queryKey: ['objective', id],
    queryFn: () => objectiveApi.getById(Number(id)),
    select: (res) => res.data.result,
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewApi.create({
        idUser: user!.id,
        idObjective: Number(id),
        raiting: rating,
        comment: comment.trim() || undefined,
        datePosted: new Date().toISOString(),
      }),
    onSuccess: () => {
      Alert.alert('Review Posted', 'Thank you for your review!');
      setComment('');
      setRating(5);
      setShowReviewForm(false);
      qc.invalidateQueries({ queryKey: ['objective', id] });
    },
    onError: () => Alert.alert('Error', 'Could not post review. Please try again.'),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!objective) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>Attraction not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = objective.images?.filter(Boolean) ?? [];
  const hasImages = images.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
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
                    <View style={[styles.carouselImg, styles.carouselPlaceholder]}>
                      <Ionicons name="image-outline" size={48} color={COLORS.textMuted} />
                    </View>
                  );
                }}
              />
              {images.length > 1 && (
                <View style={styles.dots}>
                  {images.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === imgIndex && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <LinearGradient
              colors={[COLORS.card, COLORS.cardLight]}
              style={styles.carouselPlaceholder}
            >
              <Ionicons name="image-outline" size={56} color={COLORS.textMuted} />
              <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>No images available</Text>
            </LinearGradient>
          )}

          {/* Rating overlay badge */}
          <View style={styles.ratingOverlay}>
            <Ionicons name="star" size={14} color={COLORS.star} />
            <Text style={styles.ratingOverlayText}>{objective.medieReview?.toFixed(1) ?? '—'}</Text>
          </View>
        </View>

        {/* Main Info */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{objective.name}</Text>
            {objective.objectiveType && (
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>{objective.objectiveType.name}</Text>
              </View>
            )}
          </View>

          {objective.city && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              <Text style={styles.cityText}>{objective.city}</Text>
              {objective.formattedDistance ? (
                <Text style={styles.distText}>• {objective.formattedDistance}</Text>
              ) : null}
            </View>
          )}

          {objective.description && (
            <Text style={styles.description}>{objective.description}</Text>
          )}

          {/* Info Grid */}
          {(objective.interval || objective.pret || objective.duration || objective.website) && (
            <View style={styles.infoCard}>
              {objective.interval && (
                <InfoRow icon="time-outline" label="Opening Hours" value={objective.interval} />
              )}
              {objective.pret && (
                <InfoRow icon="pricetag-outline" label="Price" value={objective.pret} color={COLORS.warning} />
              )}
              {objective.duration && (
                <InfoRow
                  icon="hourglass-outline"
                  label="Visit Duration"
                  value={`~${objective.duration} min`}
                  color={COLORS.accent}
                />
              )}
              {objective.website && (
                <InfoRow icon="globe-outline" label="Website" value={objective.website} color={COLORS.primary} />
              )}
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <View>
                <Text style={styles.reviewsTitle}>Reviews</Text>
                <Text style={styles.reviewsCount}>
                  {objective.reviews?.length ?? 0} review
                  {(objective.reviews?.length ?? 0) !== 1 ? 's' : ''}
                </Text>
              </View>
              {user && (
                <TouchableOpacity
                  style={styles.addReviewBtn}
                  onPress={() => setShowReviewForm(!showReviewForm)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[COLORS.primary, '#E91E8C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addReviewGrad}
                  >
                    <Ionicons name={showReviewForm ? 'close' : 'add'} size={18} color="#fff" />
                    <Text style={styles.addReviewText}>
                      {showReviewForm ? 'Cancel' : 'Add Review'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Review Form */}
            {showReviewForm && (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewFormLabel}>Your Rating</Text>
                <View style={styles.ratingSelector}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.7}>
                      <Ionicons
                        name={s <= rating ? 'star' : 'star-outline'}
                        size={32}
                        color={COLORS.star}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Share your experience (optional)..."
                  placeholderTextColor={COLORS.textMuted}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={1000}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{comment.length}/1000</Text>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[COLORS.primary, '#E91E8C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitBtnGrad}
                  >
                    {reviewMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Post Review</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Reviews List */}
            {(objective.reviews?.length ?? 0) === 0 ? (
              <View style={styles.noReviews}>
                <Ionicons name="chatbubble-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {objective.reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: COLORS.background },
  errorText: { fontSize: FONTS.lg, color: COLORS.text, fontWeight: '600' },
  imageCarousel: { height: 280, backgroundColor: COLORS.card },
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
  ratingOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingOverlayText: { color: COLORS.star, fontWeight: '700', fontSize: FONTS.base },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  name: { flex: 1, fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.text, lineHeight: 34 },
  typePill: {
    backgroundColor: `${COLORS.primary}22`,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${COLORS.primary}44`,
    marginTop: 4,
  },
  typePillText: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '700' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  cityText: { fontSize: FONTS.base, color: COLORS.textSub, fontWeight: '500' },
  distText: { fontSize: FONTS.base, color: COLORS.textMuted },
  description: {
    fontSize: FONTS.base,
    color: COLORS.textSub,
    lineHeight: 24,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    gap: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 2 },
  infoValue: { fontSize: FONTS.base, fontWeight: '500' },
  reviewsSection: { marginBottom: 20 },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reviewsTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text },
  reviewsCount: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 2 },
  addReviewBtn: { borderRadius: 12, overflow: 'hidden' },
  addReviewGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addReviewText: { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },
  reviewForm: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  reviewFormLabel: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  ratingSelector: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  reviewInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    color: COLORS.text,
    fontSize: FONTS.base,
    minHeight: 90,
    marginBottom: 4,
  },
  charCount: { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'right', marginBottom: 12 },
  submitBtn: { borderRadius: 12, overflow: 'hidden' },
  submitBtnGrad: { height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  submitBtnText: { color: '#fff', fontSize: FONTS.base, fontWeight: '700' },
  noReviews: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  noReviewsText: { fontSize: FONTS.base, color: COLORS.textMuted },
  reviewsList: { gap: 12 },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { color: '#fff', fontWeight: '800', fontSize: FONTS.base },
  reviewName: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text },
  reviewDate: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 1 },
  reviewComment: { fontSize: FONTS.base, color: COLORS.textSub, lineHeight: 22 },
});
