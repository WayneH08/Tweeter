import { useState } from 'react'
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import type { Sighting } from '@/lib/sightings'
import { deleteSighting } from '@/lib/sightings'

type SightingCardProps = {
  sighting: Sighting
  currentUserId?: string | null
  onDeleted?: () => void
}

export default function SightingCard({
  sighting,
  currentUserId,
  onDeleted,
}: SightingCardProps) {
  const [open, setOpen] = useState(false)

  const isOwner = currentUserId === sighting.user_id

  const date = new Date(sighting.created_at).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  // IMPORTANT:
  // Use the live profile data from profiles table.
  // Do NOT fall back to sighting.avatar_url because that is the old saved avatar.
  const avatarUrl = sighting.profiles?.avatar_url ?? null
  const username =
    sighting.profiles?.username ||
    sighting.username ||
    'unknown'

  async function handleDelete() {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this bird sighting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteSighting(sighting.id)

            if (error) {
              Alert.alert('Error', error.message)
              return
            }

            setOpen(false)
            onDeleted?.()
          },
        },
      ]
    )
  }

  function Avatar({ size = 42 }: { size?: number }) {
    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#d1d5db',
            marginRight: 10,
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
          backgroundColor: '#2f855a',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {username.charAt(0).toUpperCase()}
        </Text>
      </View>
    )
  }

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>
        <View style={styles.card}>
          {sighting.photo_url && (
            <Image source={{ uri: sighting.photo_url }} style={styles.cardImage} />
          )}

          <View style={styles.row}>
            <Avatar />

            <View style={{ flex: 1 }}>
              <Text style={styles.birdName}>🐦 {sighting.bird_name}</Text>
              <Text style={styles.meta}>@{username}</Text>
            </View>
          </View>

          <Text style={styles.location}>
            📍 {sighting.location_name || 'Unknown location'}
          </Text>

          <Text style={styles.date}>🕒 {date}</Text>

          <Text style={styles.description} numberOfLines={2}>
            {sighting.description || 'No description added'}
          </Text>

          <Text style={styles.tapText}>Tap to view details</Text>
        </View>
      </Pressable>

      <Modal visible={open} animationType="slide">
        <ScrollView
          style={{ flex: 1, backgroundColor: '#f3f4f6' }}
          contentContainerStyle={{ padding: 20, paddingTop: 60 }}
        >
          <Pressable onPress={() => setOpen(false)} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>

          {sighting.photo_url && (
            <Image source={{ uri: sighting.photo_url }} style={styles.fullImage} />
          )}

          <Text style={styles.modalTitle}>🐦 {sighting.bird_name}</Text>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Posted by</Text>

            <View style={styles.row}>
              <Avatar />
              <Text style={styles.detailText}>@{username}</Text>
            </View>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailText}>
              {sighting.location_name || 'Unknown location'}
            </Text>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Coordinates</Text>
            <Text style={styles.detailText}>
              {Number(sighting.latitude).toFixed(5)}, {Number(sighting.longitude).toFixed(5)}
            </Text>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailText}>{date}</Text>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={styles.detailText}>
              {sighting.description || 'No notes added.'}
            </Text>
          </View>

          {isOwner && (
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Delete Post</Text>
            </Pressable>
          )}
        </ScrollView>
      </Modal>
    </>
  )
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 14,
    marginBottom: 14,
    borderRadius: 14,
    width: '100%' as const,
  },
  cardImage: {
    width: '100%' as const,
    height: 210,
    borderRadius: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  birdName: {
    color: '#111827',
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  meta: {
    color: '#4b5563',
    fontSize: 13,
  },
  location: {
    color: '#111827',
    fontSize: 15,
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  date: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },
  description: {
    color: '#374151',
    fontSize: 15,
    marginBottom: 10,
  },
  tapText: {
    color: '#2563eb',
    fontWeight: 'bold' as const,
  },
  closeButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center' as const,
    marginBottom: 18,
  },
  closeText: {
    color: '#ffffff',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  fullImage: {
    width: '100%' as const,
    height: 380,
    borderRadius: 16,
    marginBottom: 18,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 30,
    fontWeight: 'bold' as const,
    marginBottom: 18,
  },
  detailBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 4,
    fontWeight: 'bold' as const,
  },
  detailText: {
    color: '#111827',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 8,
    marginBottom: 30,
  },
  deleteText: {
    color: '#ffffff',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
}