import { useEffect, useState } from 'react'
import { Image, ScrollView, Text, View } from 'react-native'
import { supabase } from '@/lib/supabase/supabase'
import ScreenWrapper from '@/components/ScreenWrapper'

type ProfileData = {
  username: string
  email: string
  createdAt: string
  avatarUrl: string | null
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) return

    setProfile({
      username:
        user.user_metadata?.username ||
        user.user_metadata?.name ||
        'Tweeter User',
      email: user.email || 'No email found',
      createdAt: user.created_at
        ? new Date(user.created_at).toLocaleDateString([], {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Unknown',
      avatarUrl: user.user_metadata?.avatar_url || null,
    })
  }

return (
  <ScreenWrapper>
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f3f4f6' }}
      contentContainerStyle={{
        padding: 24,
        paddingBottom: 80,
        alignItems: 'center',
      }}
    >
      {profile?.avatarUrl ? (
        <Image
          source={{ uri: profile.avatarUrl }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            marginBottom: 18,
            backgroundColor: '#d1d5db',
          }}
        />
      ) : (
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            marginBottom: 18,
            backgroundColor: '#2f855a',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 48, fontWeight: 'bold' }}>
            {profile?.username?.charAt(0).toUpperCase() || 'T'}
          </Text>
        </View>
      )}

      <Text
        style={{
          fontSize: 30,
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: 6,
        }}
      >
        {profile?.username || 'Loading...'}
      </Text>

      <Text
        style={{
          color: '#6b7280',
          fontSize: 16,
          marginBottom: 28,
        }}
      >
        My Tweeter Profile
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <Text style={styles.value}>{profile?.username || 'Loading...'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile?.email || 'Loading...'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Account Created</Text>
        <Text style={styles.value}>{profile?.createdAt || 'Loading...'}</Text>
      </View>

      <View style={styles.levelCard}>
        <Text style={styles.levelTitle}>Birding Level</Text>
        <Text style={styles.levelNumber}>Level 1</Text>
        <Text style={styles.levelText}>0 XP</Text>

        <View
          style={{
            width: '100%',
            height: 10,
            backgroundColor: '#d1d5db',
            borderRadius: 999,
            marginTop: 12,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: '0%',
              height: '100%',
              backgroundColor: '#2f855a',
            }}
          />
        </View>

        <Text style={styles.levelHint}>
          XP will later increase when users log birds, post sightings, and complete bird quizzes.
        </Text>
      </View>
    </ScrollView>
  </ScreenWrapper>
  )
}

const styles = {
  card: {
    width: '100%' as const,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  label: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  value: {
    color: '#111827',
    fontSize: 17,
  },
  levelCard: {
    width: '100%' as const,
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  levelTitle: {
    color: '#166534',
    fontSize: 15,
    fontWeight: 'bold' as const,
    marginBottom: 8,
  },
  levelNumber: {
    color: '#111827',
    fontSize: 28,
    fontWeight: 'bold' as const,
  },
  levelText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 2,
  },
  levelHint: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
}