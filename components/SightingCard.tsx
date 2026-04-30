import { useState } from 'react'
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import type { Sighting } from '@/lib/sightings'
import { deleteSighting } from '@/lib/sightings'
import { useTheme } from '@/lib/theme/ThemeContext'

type Props = {
  sighting: Sighting
  currentUserId?: string | null
  onDeleted?: () => void
}

type ZoomPhotoProps = {
  uri: string
  onClose: () => void
}

const { width, height } = Dimensions.get('window')

function clamp(value: number, min: number, max: number) {
  'worklet'
  return Math.min(Math.max(value, min), max)
}

function ZoomPhoto({ uri, onClose }: ZoomPhotoProps) {
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = clamp(savedScale.value * event.scale, 1, 4)
      scale.value = nextScale
    })
    .onEnd(() => {
      savedScale.value = scale.value

      if (scale.value <= 1.01) {
        scale.value = withTiming(1, { duration: 160 })
        savedScale.value = 1

        translateX.value = withTiming(0, { duration: 160 })
        translateY.value = withTiming(0, { duration: 160 })
        savedTranslateX.value = 0
        savedTranslateY.value = 0
      }
    })

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= 1) return

      const maxTranslateX = (width * (scale.value - 1)) / 2
      const maxTranslateY = (height * (scale.value - 1)) / 2

      const nextX = savedTranslateX.value + event.translationX
      const nextY = savedTranslateY.value + event.translationY

      translateX.value = clamp(nextX, -maxTranslateX, maxTranslateX)
      translateY.value = clamp(nextY, -maxTranslateY, maxTranslateY)
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value
      savedTranslateY.value = translateY.value
    })

  const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture)

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }
  })

  function handleClose() {
    scale.value = 1
    savedScale.value = 1

    translateX.value = 0
    translateY.value = 0
    savedTranslateX.value = 0
    savedTranslateY.value = 0

    onClose()
  }

  return (
    <View style={imageViewerStyles.imageViewerScreen}>
      <Pressable
        onPress={handleClose}
        style={imageViewerStyles.imageCloseButton}
        hitSlop={18}
      >
        <Text style={imageViewerStyles.imageCloseText}>✕</Text>
      </Pressable>

      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={imageViewerStyles.zoomStage}>
          <Animated.Image
            source={{ uri }}
            style={[imageViewerStyles.zoomImage, animatedImageStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

export default function SightingCard({
  sighting,
  currentUserId,
  onDeleted,
}: Props) {
  const { theme } = useTheme()
  const styles = createStyles(theme.colors)

  const [open, setOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const [imageSession, setImageSession] = useState(0)
  const [detailKey, setDetailKey] = useState(0)

  const isOwner = currentUserId === sighting.user_id
  const hasPhoto = !!sighting.photo_url

  const username = sighting.profiles?.username || sighting.username || 'unknown'
  const avatarUrl = sighting.profiles?.avatar_url ?? null

  const shortDate = new Date(sighting.created_at).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const fullDate = new Date(sighting.created_at).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  function openDetails() {
    setImageOpen(false)
    setOpen(true)
  }

  function closeDetails() {
    setImageOpen(false)
    setOpen(false)
    setDetailKey((prev) => prev + 1)
  }

  function openImageViewer() {
    if (!sighting.photo_url) return

    setImageSession((prev) => prev + 1)
    setImageOpen(true)
  }

  function closeImageViewer() {
    setImageOpen(false)
    setImageSession((prev) => prev + 1)
  }

  function Avatar({ size = 42 }: { size?: number }) {
    if (avatarUrl) {
      return (
        <Image
          key={avatarUrl}
          source={{ uri: avatarUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            marginRight: 10,
            backgroundColor: theme.colors.cardAlt,
          }}
        />
      )
    }

    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Text style={{ color: theme.colors.primaryText, fontWeight: 'bold' }}>
          {username.charAt(0).toUpperCase()}
        </Text>
      </View>
    )
  }

  function openMenu() {
    if (!isOwner) {
      Alert.alert('Post Options', 'No actions available for this post.', [
        { text: 'OK' },
      ])
      return
    }

    Alert.alert('Post Options', undefined, [
      {
        text: 'Delete Post',
        style: 'destructive',
        onPress: confirmDelete,
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  function confirmDelete() {
    Alert.alert('Delete Post', 'Are you sure you want to delete this sighting?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: handleDelete,
      },
    ])
  }

  async function handleDelete() {
    const { error } = await deleteSighting(sighting.id)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setImageOpen(false)
    setOpen(false)
    onDeleted?.()
  }

  return (
    <>
      <View style={styles.post}>
        <View style={styles.header}>
          <Pressable onPress={openDetails} style={styles.headerMain}>
            <Avatar />

            <View style={{ flex: 1 }}>
              <Text style={styles.username}>@{username}</Text>
              <Text style={styles.location} numberOfLines={1}>
                📍 {sighting.location_name || 'Unknown location'}
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={openMenu} hitSlop={14}>
            <Text style={styles.dots}>•••</Text>
          </Pressable>
        </View>

        {hasPhoto && (
          <Pressable onPress={openDetails}>
            <Image source={{ uri: sighting.photo_url! }} style={styles.image} />
          </Pressable>
        )}

        <Pressable
          onPress={openDetails}
          style={[styles.body, !hasPhoto && styles.compact]}
        >
          <Text style={styles.bird}>🐦 {sighting.bird_name}</Text>

          <Text style={styles.caption} numberOfLines={hasPhoto ? 3 : undefined}>
            <Text style={styles.captionUser}>@{username} </Text>
            {sighting.description || 'No description added.'}
          </Text>

          <View style={styles.meta}>
            <Text style={styles.date}>{shortDate}</Text>
            <Text style={styles.details}>View details</Text>
          </View>
        </Pressable>
      </View>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetails}
      >
        <ScrollView
          key={`details-${detailKey}`}
          style={styles.detailScreen}
          contentContainerStyle={styles.detailContent}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={closeDetails} hitSlop={14}>
              <Text style={styles.close}>✕</Text>
            </Pressable>

            <Pressable onPress={openMenu} hitSlop={14}>
              <Text style={styles.dots}>•••</Text>
            </Pressable>
          </View>

          {hasPhoto && (
            <Pressable onPress={openImageViewer} style={styles.fullImageWrap}>
              <Image source={{ uri: sighting.photo_url! }} style={styles.fullImage} />

              <View style={styles.imageZoomBadge}>
                <Text style={styles.imageZoomIcon}>🔍</Text>
              </View>
            </Pressable>
          )}

          <Text style={styles.modalTitle}>🐦 {sighting.bird_name}</Text>

          <View style={styles.box}>
            <Text style={styles.label}>Posted by</Text>
            <View style={styles.row}>
              <Avatar />
              <Text style={styles.text}>@{username}</Text>
            </View>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.text}>
              {sighting.location_name || 'Unknown location'}
            </Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>Coordinates</Text>
            <Text style={styles.text}>
              {Number(sighting.latitude).toFixed(5)}, {Number(sighting.longitude).toFixed(5)}
            </Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.text}>{fullDate}</Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.text}>
              {sighting.description || 'No notes added.'}
            </Text>
          </View>
        </ScrollView>

        {imageOpen && hasPhoto && (
          <Modal
            key={`image-modal-${imageSession}`}
            visible={imageOpen}
            animationType="fade"
            presentationStyle="fullScreen"
            onRequestClose={closeImageViewer}
          >
            <ZoomPhoto
              key={`zoom-photo-${imageSession}`}
              uri={sighting.photo_url!}
              onClose={closeImageViewer}
            />
          </Modal>
        )}
      </Modal>
    </>
  )
}

function createStyles(colors: {
  background: string
  card: string
  cardAlt: string
  text: string
  mutedText: string
  border: string
  primary: string
  primaryText: string
  inputBackground: string
  tabBar: string
  tabBarActive: string
  tabBarInactive: string
  danger: string
}) {
  return {
    post: {
      backgroundColor: colors.card,
      borderRadius: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 12,
      backgroundColor: colors.card,
    },
    headerMain: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    username: {
      fontWeight: '800' as const,
      fontSize: 16,
      color: colors.text,
    },
    location: {
      color: colors.mutedText,
      fontSize: 13,
    },
    dots: {
      fontSize: 22,
      color: colors.mutedText,
      paddingHorizontal: 6,
      fontWeight: '800' as const,
    },
    image: {
      width: '100%' as const,
      height: 340,
      backgroundColor: colors.cardAlt,
    },
    body: {
      padding: 14,
      backgroundColor: colors.card,
    },
    compact: {
      paddingTop: 8,
      paddingBottom: 12,
    },
    bird: {
      fontSize: 22,
      fontWeight: '900' as const,
      marginBottom: 6,
      color: colors.text,
    },
    caption: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 21,
      marginBottom: 10,
    },
    captionUser: {
      fontWeight: '800' as const,
      color: colors.text,
    },
    meta: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    date: {
      color: colors.mutedText,
      fontSize: 13,
      fontWeight: '600' as const,
    },
    details: {
      color: colors.primary,
      fontWeight: '800' as const,
      fontSize: 14,
    },
    detailScreen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    detailContent: {
      padding: 16,
      paddingTop: 24,
      paddingBottom: 40,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    close: {
      fontSize: 26,
      fontWeight: '900' as const,
      color: colors.text,
    },
    fullImageWrap: {
      position: 'relative' as const,
      marginBottom: 14,
    },
    fullImage: {
      width: '100%' as const,
      height: 360,
      borderRadius: 14,
      backgroundColor: colors.cardAlt,
    },
    imageZoomBadge: {
      position: 'absolute' as const,
      right: 12,
      bottom: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    imageZoomIcon: {
      fontSize: 17,
    },
    modalTitle: {
      fontSize: 28,
      fontWeight: '900' as const,
      color: colors.text,
      marginBottom: 14,
    },
    box: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      color: colors.mutedText,
      fontSize: 13,
      fontWeight: 'bold' as const,
      marginBottom: 4,
    },
    text: {
      fontSize: 16,
      color: colors.text,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: 6,
    },
  }
}

const imageViewerStyles = {
  imageViewerScreen: {
    flex: 1,
    backgroundColor: 'black',
  },
  imageCloseButton: {
    position: 'absolute' as const,
    top: 58,
    right: 22,
    zIndex: 999,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  imageCloseText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900' as const,
  },
  zoomStage: {
    flex: 1,
    width,
    height,
    backgroundColor: 'black',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  },
  zoomImage: {
    width,
    height,
  },
}