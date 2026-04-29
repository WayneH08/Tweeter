import { useState } from 'react'
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import type { Sighting } from '@/lib/sightings'

export default function SightingCard({ sighting }: { sighting: Sighting }) {
  const [open, setOpen] = useState(false)

  const date = new Date(sighting.created_at).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>
        <View style={styles.card}>
          {sighting.photo_url && (
            <Image source={{ uri: sighting.photo_url }} style={styles.cardImage} />
          )}

          <Text style={styles.birdName}>🐦 {sighting.bird_name}</Text>

          <Text style={styles.meta}>👤 @{sighting.username || 'unknown'}</Text>

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
            <Text style={styles.detailText}>@{sighting.username || 'unknown'}</Text>
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
              {sighting.latitude}, {sighting.longitude}
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
  birdName: {
    color: '#111827',
    fontSize: 22,
    fontWeight: 'bold' as const,
    marginBottom: 6,
  },
  meta: {
    color: '#4b5563',
    fontSize: 14,
    marginBottom: 4,
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
}