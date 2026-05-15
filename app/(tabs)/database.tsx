import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ScreenWrapper from "@/components/ScreenWrapper";
import {
  Bird,
  BirdRow,
  PLACEHOLDER_BIRDS,
  mapBirdRowToBird,
} from "@/data/birds";
import { supabase } from "@/lib/supabase/supabase";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function DatabaseScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme.colors);

  const soundRef = useRef<Audio.Sound | null>(null);

  const [birds, setBirds] = useState<Bird[]>(PLACEHOLDER_BIRDS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const [playingBirdId, setPlayingBirdId] = useState<string | null>(null);

  async function stopCurrentSound() {
    if (!soundRef.current) return;

    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } catch (error) {
      console.log("Error stopping bird audio:", error);
    } finally {
      soundRef.current = null;
      setPlayingBirdId(null);
    }
  }

  async function loadBirds(showRefreshing = false) {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("birds")
      .select("*")
      .order("common_name", { ascending: true });

    if (error) {
      console.log("Error loading birds:", error.message);
      setBirds(PLACEHOLDER_BIRDS);
    } else if (data && data.length > 0) {
      setBirds((data as BirdRow[]).map(mapBirdRowToBird));
    } else {
      setBirds(PLACEHOLDER_BIRDS);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadBirds();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const allTags = useMemo(() => {
    const tags = birds.flatMap((bird) => bird.tags);
    return ["All", ...Array.from(new Set(tags))];
  }, [birds]);

  const filteredBirds = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return birds.filter((bird) => {
      const matchesSearch =
        bird.commonName.toLowerCase().includes(normalizedSearch) ||
        bird.scientificName.toLowerCase().includes(normalizedSearch) ||
        bird.region.toLowerCase().includes(normalizedSearch) ||
        bird.habitat.toLowerCase().includes(normalizedSearch) ||
        bird.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      const matchesTag =
        selectedTag === "All" || bird.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [birds, search, selectedTag]);

  async function handlePlayCall(bird: Bird) {
    if (!bird.audioUrl) {
      Alert.alert(
        "Bird call placeholder",
        `No real audio file is attached yet.\n\nCurrent placeholder: ${bird.callLabel}.`,
      );
      return;
    }

    if (playingBirdId === bird.id) {
      await stopCurrentSound();
      return;
    }

    try {
      await stopCurrentSound();

      setPlayingBirdId(bird.id);

      const { sound } = await Audio.Sound.createAsync(
        {
          uri: bird.audioUrl,
        },
        {
          shouldPlay: true,
        },
      );

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          setPlayingBirdId(null);
        }
      });
    } catch (error) {
      console.log("Audio playback error:", error);
      await stopCurrentSound();
      Alert.alert("Audio error", "Could not play this bird call.");
    }
  }

  function renderBirdCard({ item }: { item: Bird }) {
    return (
      <Pressable
        style={({ pressed }) => [styles.birdCard, pressed && styles.pressed]}
        onPress={() => setSelectedBird(item)}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.birdThumb} />

        <View style={styles.birdInfo}>
          <View style={styles.birdTopRow}>
            <View style={styles.birdNameGroup}>
              <Text style={styles.birdName} numberOfLines={1}>
                {item.commonName}
              </Text>

              <Text style={styles.scientificName} numberOfLines={1}>
                {item.scientificName}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.mutedText}
            />
          </View>

          <Text style={styles.quickInfo} numberOfLines={2}>
            {item.region}
          </Text>

          <View style={styles.compactTagsRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View key={`${item.id}-${tag}`} style={styles.compactTag}>
                <Text style={styles.compactTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.compactHeader}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.eyebrow}>Tweeter field guide</Text>
            <Text style={styles.title}>Bird Database</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.headerBadge,
              pressed && styles.pressed,
            ]}
            onPress={() => loadBirds(true)}
          >
            <Ionicons
              name="refresh-outline"
              size={22}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          Search birds, browse quick facts, and tap any card for more details.
        </Text>

        <View style={styles.searchRow}>
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.mutedText}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search bird, region, habitat..."
            placeholderTextColor={theme.colors.mutedText}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.mutedText}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.filterShell}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {allTags.map((tag) => {
              const active = selectedTag === tag;

              return (
                <Pressable
                  key={tag}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {filteredBirds.length}{" "}
            {filteredBirds.length === 1 ? "result" : "results"}
          </Text>

          <Text style={styles.resultsHint}>
            {loading ? "Loading..." : "Tap to open"}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading birds...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBirds}
            keyExtractor={(item) => item.id}
            renderItem={renderBirdCard}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadBirds(true)}
                tintColor={theme.colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons
                  name="search-outline"
                  size={34}
                  color={theme.colors.mutedText}
                />

                <Text style={styles.emptyTitle}>No birds found</Text>

                <Text style={styles.emptyText}>
                  Try searching another name, habitat, region, or tag.
                </Text>
              </View>
            }
          />
        )}

        <Modal
          visible={selectedBird !== null}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedBird(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {selectedBird && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHandle} />

                    <Pressable
                      style={styles.closeButton}
                      onPress={() => setSelectedBird(null)}
                    >
                      <Ionicons
                        name="close"
                        size={22}
                        color={theme.colors.text}
                      />
                    </Pressable>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalScrollContent}
                  >
                    <Image
                      source={{ uri: selectedBird.imageUrl }}
                      style={styles.modalImage}
                    />

                    <Text style={styles.modalTitle}>
                      {selectedBird.commonName}
                    </Text>

                    <Text style={styles.modalScientificName}>
                      {selectedBird.scientificName}
                    </Text>

                    <View style={styles.modalTagsRow}>
                      {selectedBird.tags.map((tag) => (
                        <View
                          key={`modal-${selectedBird.id}-${tag}`}
                          style={styles.tagPill}
                        >
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.sectionTitle}>Overview</Text>

                    <Text style={styles.bodyText}>
                      {selectedBird.description}
                    </Text>

                    <View style={styles.detailGrid}>
                      <DetailItem
                        icon="location-outline"
                        label="Region"
                        value={selectedBird.region}
                        colors={theme.colors}
                      />

                      <DetailItem
                        icon="trail-sign-outline"
                        label="Habitat"
                        value={selectedBird.habitat}
                        colors={theme.colors}
                      />

                      <DetailItem
                        icon="resize-outline"
                        label="Size"
                        value={selectedBird.size}
                        colors={theme.colors}
                      />

                      <DetailItem
                        icon="nutrition-outline"
                        label="Diet"
                        value={selectedBird.diet}
                        colors={theme.colors}
                      />
                    </View>

                    <View style={styles.factBox}>
                      <Text style={styles.factLabel}>Fun fact</Text>

                      <Text style={styles.factText}>
                        {selectedBird.funFact}
                      </Text>
                    </View>

                    <View style={styles.callBox}>
                      <View style={styles.callInfo}>
                        <Text style={styles.callLabel}>Call / sound</Text>

                        <Text style={styles.callDescription}>
                          {selectedBird.callLabel}
                        </Text>
                      </View>

                      <Pressable
                        style={({ pressed }) => [
                          styles.callButton,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => handlePlayCall(selectedBird)}
                      >
                        <Ionicons
                          name={
                            playingBirdId === selectedBird.id
                              ? "pause-outline"
                              : "volume-high-outline"
                          }
                          size={18}
                          color={theme.colors.primaryText}
                        />

                        <Text style={styles.callButtonText}>
                          {playingBirdId === selectedBird.id
                            ? "Stop"
                            : selectedBird.audioUrl
                              ? "Play"
                              : "Preview"}
                        </Text>
                      </Pressable>
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

function DetailItem({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: {
    cardAlt: string;
    border: string;
    text: string;
    mutedText: string;
    primary: string;
  };
}) {
  return (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 18,
        padding: 14,
        gap: 7,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <Ionicons name={icon} size={16} color={colors.primary} />

        <Text
          style={{
            color: colors.primary,
            fontSize: 12,
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          {label}
        </Text>
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize: 14,
          lineHeight: 20,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function createStyles(colors: {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  primaryText: string;
  inputBackground: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  danger: string;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 18,
      paddingTop: 10,
    },
    compactHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    headerTextGroup: {
      flex: 1,
      paddingRight: 12,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 1,
      textTransform: "uppercase",
      color: colors.primary,
      marginBottom: 2,
    },
    title: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.text,
    },
    headerBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.mutedText,
      marginBottom: 12,
      maxWidth: 340,
    },
    searchRow: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: 12,
    },
    filterShell: {
      marginBottom: 12,
    },
    filterRow: {
      gap: 8,
      paddingRight: 18,
    },
    filterPill: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.mutedText,
    },
    filterTextActive: {
      color: colors.primaryText,
    },
    resultsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    resultsTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.text,
    },
    resultsHint: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.mutedText,
    },
    loadingCard: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 24,
      marginTop: 12,
      gap: 10,
    },
    loadingText: {
      color: colors.mutedText,
      fontSize: 14,
      fontWeight: "700",
    },
    listContent: {
      paddingBottom: 34,
      gap: 12,
      flexGrow: 1,
    },
    birdCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 22,
      padding: 10,
      gap: 12,
      alignItems: "center",
    },
    birdThumb: {
      width: 82,
      height: 82,
      borderRadius: 18,
      backgroundColor: colors.cardAlt,
    },
    birdInfo: {
      flex: 1,
      gap: 7,
    },
    birdTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    birdNameGroup: {
      flex: 1,
    },
    birdName: {
      fontSize: 17,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 2,
    },
    scientificName: {
      fontSize: 13,
      fontStyle: "italic",
      color: colors.mutedText,
    },
    quickInfo: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.mutedText,
    },
    compactTagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    compactTag: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.cardAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    compactTagText: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.mutedText,
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.99 }],
    },
    emptyCard: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 24,
      marginTop: 18,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.text,
      marginTop: 10,
      marginBottom: 4,
    },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      color: colors.mutedText,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    modalCard: {
      maxHeight: "88%",
      backgroundColor: colors.background,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    modalHeader: {
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    modalHandle: {
      width: 46,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.border,
    },
    closeButton: {
      position: "absolute",
      right: 16,
      top: 13,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalScrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 34,
    },
    modalImage: {
      width: "100%",
      height: 220,
      borderRadius: 24,
      backgroundColor: colors.cardAlt,
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 4,
    },
    modalScientificName: {
      fontSize: 15,
      fontStyle: "italic",
      color: colors.mutedText,
      marginBottom: 12,
    },
    modalTagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 18,
    },
    tagPill: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagText: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.mutedText,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 8,
    },
    bodyText: {
      fontSize: 15,
      lineHeight: 23,
      color: colors.mutedText,
      marginBottom: 16,
    },
    detailGrid: {
      gap: 10,
      marginBottom: 14,
    },
    factBox: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 14,
      marginBottom: 14,
    },
    factLabel: {
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: colors.primary,
      marginBottom: 5,
    },
    factText: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.text,
    },
    callBox: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 14,
      gap: 12,
      marginBottom: 8,
    },
    callInfo: {
      gap: 4,
    },
    callLabel: {
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.7,
      textTransform: "uppercase",
      color: colors.primary,
    },
    callDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.mutedText,
    },
    callButton: {
      minHeight: 46,
      borderRadius: 16,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    callButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: "900",
    },
  });
}
