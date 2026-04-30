import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import MapView, { Callout, Marker, Region } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

import { supabase } from '@/lib/supabase/supabase'
import { useTheme } from '@/lib/theme/ThemeContext'

type Sighting = {
  id: string
  user_id?: string
  username?: string | null
  bird_name?: string | null
  description?: string | null
  latitude: number
  longitude: number
  location_name?: string | null
  photo_url?: string | null
  created_at?: string
}

type MapIconOption = {
  id: string
  name: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  background: string
}

const ICON_OPTIONS: MapIconOption[] = [
  {
    id: 'birdwatcher',
    name: 'Birdwatcher',
    label: 'Default explorer icon',
    icon: 'eye-outline',
    color: '#2563eb',
    background: '#dbeafe',
  },
  {
    id: 'cardinal',
    name: 'Cardinal',
    label: 'Red bird marker',
    icon: 'flame-outline',
    color: '#dc2626',
    background: '#fee2e2',
  },
  {
    id: 'bluejay',
    name: 'Blue Jay',
    label: 'Blue bird marker',
    icon: 'leaf-outline',
    color: '#0284c7',
    background: '#e0f2fe',
  },
  {
    id: 'owl',
    name: 'Owl',
    label: 'Night watcher marker',
    icon: 'moon-outline',
    color: '#7c3aed',
    background: '#ede9fe',
  },
  {
    id: 'sparrow',
    name: 'Sparrow',
    label: 'Simple green marker',
    icon: 'navigate-outline',
    color: '#16a34a',
    background: '#dcfce7',
  },
]

const INITIAL_REGION: Region = {
  latitude: 33.2148,
  longitude: -97.1331,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
}

export default function MapScreen() {
  const { theme } = useTheme()

  const colors = useMemo(() => {
    const isDark = theme.name === 'dark' || theme.name === 'goingGreen'

    return {
      background: theme.colors.background,
      card: theme.colors.card,
      cardSoft: theme.colors.cardAlt,
      text: theme.colors.text,
      mutedText: theme.colors.mutedText,
      border: theme.colors.border,
      primary: theme.colors.primary,
      primaryText: theme.colors.primaryText,
      danger: theme.colors.danger,
      overlayCard: isDark ? 'rgba(17, 24, 39, 0.96)' : 'rgba(255, 255, 255, 0.96)',
      overlayCardStrong: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
      infoBackdrop: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(15, 23, 42, 0.35)',
      white: '#ffffff',
      shadow: '#000',
    }
  }, [theme])

  const styles = useMemo(() => createStyles(colors), [colors])

  const [sightings, setSightings] = useState<Sighting[]>([])
  const [loadingSightings, setLoadingSightings] = useState(true)
  const [locationLoading, setLocationLoading] = useState(true)

  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  const [selectedIcon, setSelectedIcon] = useState<MapIconOption>(
    ICON_OPTIONS[0]
  )

  const [iconMenuVisible, setIconMenuVisible] = useState(false)
  const [mapInfoVisible, setMapInfoVisible] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const mapRegion = useMemo<Region>(() => {
    if (!userLocation) return INITIAL_REGION

    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    }
  }, [userLocation])

  async function loadSightings() {
    setLoadingSightings(true)

    const { data, error } = await supabase
      .from('sightings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Error loading sightings:', error.message)
      Alert.alert('Map error', 'Could not load bird sightings right now.')
    }

    if (data) {
      setSightings(data as Sighting[])
    }

    setLoadingSightings(false)
  }

  async function loadUserLocation() {
    setLocationLoading(true)

    const { status } = await Location.requestForegroundPermissionsAsync()

    if (status !== 'granted') {
      setLocationLoading(false)
      Alert.alert(
        'Location permission needed',
        'Turn on location permissions to show your current position on the map.'
      )
      return
    }

    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    setUserLocation({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    })

    setLocationLoading(false)
  }

  useEffect(() => {
    loadSightings()
    loadUserLocation()
  }, [])

  function formatDate(dateString?: string) {
    if (!dateString) return 'Recently'

    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const mapContent = (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        region={mapRegion}
        showsCompass
        showsScale
      >
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View
              style={[
                styles.userLocationOuterDot,
                { backgroundColor: selectedIcon.background },
              ]}
            >
              <View
                style={[
                  styles.userLocationInnerDot,
                  {
                    backgroundColor: selectedIcon.color,
                    borderColor: colors.white,
                  },
                ]}
              >
                <Ionicons name={selectedIcon.icon} size={16} color={colors.white} />
              </View>
            </View>
          </Marker>
        )}

        {sightings.map((sighting) => {
          if (!sighting.latitude || !sighting.longitude) return null

          return (
            <Marker
              key={sighting.id}
              coordinate={{
                latitude: sighting.latitude,
                longitude: sighting.longitude,
              }}
            >
              <View style={styles.sightingMarker}>
                <View style={styles.sightingMarkerIcon}>
                  <Ionicons name="leaf" size={18} color={colors.primaryText} />
                </View>
              </View>

              <Callout tooltip>
                <View style={styles.calloutCard}>
                  <View style={styles.calloutHeader}>
                    <View style={styles.placeholderImage}>
                      <Ionicons
                        name="image-outline"
                        size={24}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.calloutHeaderText}>
                      <Text style={styles.calloutTitle} numberOfLines={1}>
                        {sighting.bird_name || 'Unknown Bird'}
                      </Text>

                      <Text style={styles.calloutUsername} numberOfLines={1}>
                        @{sighting.username || 'birdwatcher'}
                      </Text>
                    </View>
                  </View>

                  {!!sighting.location_name && (
                    <View style={styles.calloutRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.mutedText}
                      />

                      <Text style={styles.calloutText} numberOfLines={2}>
                        {sighting.location_name}
                      </Text>
                    </View>
                  )}

                  {!!sighting.description && (
                    <Text style={styles.calloutDescription} numberOfLines={3}>
                      {sighting.description}
                    </Text>
                  )}

                  <View style={styles.calloutFooter}>
                    <Text style={styles.calloutDate}>
                      {formatDate(sighting.created_at)}
                    </Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          )
        })}
      </MapView>

      <View
        style={[
          styles.topControls,
          isFullscreen && styles.fullscreenTopControls,
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.circleButton,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setIconMenuVisible(false)
            setMapInfoVisible(false)
            setIsFullscreen((current) => !current)
          }}
        >
          <Ionicons
            name={isFullscreen ? 'contract-outline' : 'expand-outline'}
            size={22}
            color={colors.primary}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.centerTitleCard,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setIconMenuVisible(false)
            setMapInfoVisible(true)
          }}
        >
          <View style={styles.titleIcon}>
            <Ionicons name="map-outline" size={17} color={colors.primary} />
          </View>

          <View style={styles.titleTextWrap}>
            <Text style={styles.title}>Bird Map</Text>
            <Text style={styles.subtitle}>
              {loadingSightings
                ? 'Loading sightings...'
                : `${sightings.length} recent sightings`}
            </Text>
          </View>

          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.mutedText}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.circleButton,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setMapInfoVisible(false)
            setIconMenuVisible((current) => !current)
          }}
        >
          <Ionicons name="color-palette-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {iconMenuVisible && (
        <View
          style={[
            styles.iconDropdown,
            isFullscreen && styles.fullscreenIconDropdown,
          ]}
        >
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Your icon</Text>
            <Pressable onPress={() => setIconMenuVisible(false)}>
              <Ionicons name="close" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.dropdownList}
          >
            {ICON_OPTIONS.map((option) => {
              const isSelected = selectedIcon.id === option.id

              return (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [
                    styles.dropdownOption,
                    isSelected && styles.dropdownOptionSelected,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    setSelectedIcon(option)
                    setIconMenuVisible(false)
                  }}
                >
                  <View
                    style={[
                      styles.dropdownIconBubble,
                      { backgroundColor: option.background },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={option.color}
                    />
                  </View>

                  <View style={styles.dropdownOptionTextWrap}>
                    <Text style={styles.dropdownOptionName}>
                      {option.name}
                    </Text>
                    <Text style={styles.dropdownOptionLabel}>
                      {option.label}
                    </Text>
                  </View>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.bottomOverlay}>
        <Pressable
          style={({ pressed }) => [
            styles.locationButton,
            pressed && styles.pressed,
          ]}
          onPress={loadUserLocation}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={20} color={colors.primary} />
          )}

          <Text style={styles.locationButtonText}>My location</Text>
        </Pressable>
      </View>

      <Modal
        visible={mapInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMapInfoVisible(false)}
      >
        <Pressable
          style={styles.infoBackdrop}
          onPress={() => setMapInfoVisible(false)}
        >
          <Pressable style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIconBubble}>
                <Ionicons name="map-outline" size={22} color={colors.primary} />
              </View>

              <View style={styles.infoTitleWrap}>
                <Text style={styles.infoTitle}>Bird Map</Text>
                <Text style={styles.infoSubtitle}>Map tools preview</Text>
              </View>

              <Pressable
                style={styles.infoCloseButton}
                onPress={() => setMapInfoVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="leaf-outline" size={18} color={colors.primary} />
              <Text style={styles.infoText}>
                Tap bird pins to preview sighting details.
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
              <Text style={styles.infoText}>
                Use the palette button to change your map icon.
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="expand-outline" size={18} color={colors.primary} />
              <Text style={styles.infoText}>
                Use fullscreen mode for a cleaner map view.
              </Text>
            </View>

            <Text style={styles.infoPlaceholder}>
              Later this can hold filters like recent sightings, nearby birds,
              rare birds, or species search.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )

  return (
    <>
      <Tabs.Screen
        options={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            isFullscreen && styles.hiddenTabBar,
          ],
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.primary,
        }}
      />

      <View style={styles.screen}>{mapContent}</View>
    </>
  )
}

function createStyles(colors: {
  background: string
  card: string
  cardSoft: string
  text: string
  mutedText: string
  border: string
  primary: string
  primaryText: string
  danger: string
  overlayCard: string
  overlayCardStrong: string
  infoBackdrop: string
  white: string
  shadow: string
}) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    map: {
      flex: 1,
    },

    tabBar: {
      height: 86,
      paddingTop: 8,
      paddingBottom: 18,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    hiddenTabBar: {
      display: 'none',
    },

    topControls: {
      position: 'absolute',
      top: 58,
      left: 14,
      right: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    fullscreenTopControls: {
      top: 58,
    },

    circleButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.overlayCard,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },

    centerTitleCard: {
      flex: 1,
      maxWidth: 230,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.overlayCard,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    titleIcon: {
      width: 31,
      height: 31,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardSoft,
    },
    titleTextWrap: {
      alignItems: 'center',
    },
    title: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.text,
    },
    subtitle: {
      marginTop: 1,
      fontSize: 11,
      fontWeight: '700',
      color: colors.mutedText,
    },

    iconDropdown: {
      position: 'absolute',
      top: 112,
      right: 14,
      width: 285,
      maxHeight: 350,
      padding: 12,
      borderRadius: 22,
      backgroundColor: colors.overlayCardStrong,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    fullscreenIconDropdown: {
      top: 112,
    },
    dropdownHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    dropdownTitle: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.text,
    },
    dropdownList: {
      gap: 8,
    },
    dropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    dropdownOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.cardSoft,
    },
    dropdownIconBubble: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownOptionTextWrap: {
      flex: 1,
    },
    dropdownOptionName: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.text,
    },
    dropdownOptionLabel: {
      marginTop: 1,
      fontSize: 11,
      fontWeight: '600',
      color: colors.mutedText,
    },

    bottomOverlay: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 20,
      alignItems: 'flex-end',
    },
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: colors.overlayCard,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    locationButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
    },

    userLocationOuterDot: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 9,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    userLocationInnerDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },

    sightingMarker: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    sightingMarkerIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.white,
      backgroundColor: colors.primary,
      shadowColor: colors.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 5,
    },

    calloutCard: {
      width: 250,
      padding: 12,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    calloutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    placeholderImage: {
      width: 54,
      height: 54,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardSoft,
    },
    calloutHeaderText: {
      flex: 1,
    },
    calloutTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
    },
    calloutUsername: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: '700',
      color: colors.mutedText,
    },
    calloutRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 5,
      marginBottom: 8,
    },
    calloutText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: colors.mutedText,
    },
    calloutDescription: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
      color: colors.text,
    },
    calloutFooter: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    calloutDate: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.mutedText,
    },

    infoBackdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: colors.infoBackdrop,
    },
    infoCard: {
      width: '100%',
      maxWidth: 390,
      padding: 18,
      borderRadius: 26,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    infoIconBubble: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardSoft,
    },
    infoTitleWrap: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
    },
    infoSubtitle: {
      marginTop: 2,
      fontSize: 13,
      fontWeight: '600',
      color: colors.mutedText,
    },
    infoCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardSoft,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.text,
    },
    infoPlaceholder: {
      marginTop: 6,
      padding: 12,
      borderRadius: 16,
      overflow: 'hidden',
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '600',
      color: colors.mutedText,
      backgroundColor: colors.cardSoft,
    },

    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },
  })
}