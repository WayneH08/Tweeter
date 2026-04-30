import { useEffect, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase/supabase'
import ScreenWrapper from '@/components/ScreenWrapper'

type ProfileData = {
  userId: string
  username: string
  email: string
  createdAt: string
  avatarUrl: string | null
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    loadProfile()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)

      if (session?.user) {
        loadProfile()
      } else {
        setProfile(null)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function loadProfile() {
    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) {
      setIsLoggedIn(false)
      setProfile(null)
      return
    }

    setIsLoggedIn(true)

    const fallbackUsername =
      user.user_metadata?.username ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Tweeter User'

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    const finalUsername = profileRow?.username || fallbackUsername
    const finalAvatarUrl =
      profileRow?.avatar_url || user.user_metadata?.avatar_url || null

    await supabase.from('profiles').upsert(
      {
        id: user.id,
        username: finalUsername,
        avatar_url: finalAvatarUrl,
      },
      { onConflict: 'id' }
    )

    setProfile({
      userId: user.id,
      username: finalUsername,
      email: user.email || 'No email found',
      createdAt: user.created_at
        ? new Date(user.created_at).toLocaleDateString([], {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Unknown',
      avatarUrl: finalAvatarUrl,
    })
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      Alert.alert('Logout error', error.message)
      return
    }

    setProfile(null)
    setIsLoggedIn(false)
    router.push('/auth')
  }

  async function syncAvatarEverywhere(avatarUrl: string | null) {
    if (!profile) return false

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        username: profile.username,
        avatar_url: avatarUrl,
      },
    })

    if (authError) {
      Alert.alert('Profile update error', authError.message)
      return false
    }

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: profile.userId,
        username: profile.username,
        avatar_url: avatarUrl,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      Alert.alert('Profile table error', profileError.message)
      return false
    }

    await supabase
      .from('sightings')
      .update({
        username: profile.username,
        avatar_url: avatarUrl,
      })
      .eq('user_id', profile.userId)

    setProfile({
      ...profile,
      avatarUrl,
    })

    return true
  }

  async function pickAndUploadAvatar() {
    if (!profile?.userId || uploading) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (result.canceled) return

    try {
      setUploading(true)

      const imageUri = result.assets[0].uri

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      })

      const filePath = `${profile.userId}/avatar-${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        Alert.alert('Upload error', uploadError.message)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const success = await syncAvatarEverywhere(data.publicUrl)

      if (success) {
        Alert.alert('Success', 'Profile picture updated.')
      }
    } finally {
      setUploading(false)
    }
  }

  async function removeAvatar() {
    if (!profile || uploading) return

    const success = await syncAvatarEverywhere(null)

    if (success) {
      Alert.alert('Success', 'Profile picture removed.')
    }
  }

  if (!isLoggedIn) {
    return (
      <ScreenWrapper>
        <View style={styles.centerScreen}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>You are not logged in.</Text>

          <Pressable onPress={() => router.push('/auth')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Go to Login</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#f3f4f6' }}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 90,
          alignItems: 'center',
        }}
      >
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your Tweeter account</Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusText}>Logged in</Text>
          <Text style={styles.statusSubtext}>{profile?.email || 'Loading...'}</Text>
        </View>

        {profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.defaultAvatarText}>
              {profile?.username?.charAt(0).toUpperCase() || 'T'}
            </Text>
          </View>
        )}

        <Pressable
          onPress={pickAndUploadAvatar}
          disabled={uploading}
          style={[styles.avatarButton, uploading && { opacity: 0.6 }]}
        >
          <Text style={styles.avatarButtonText}>
            {uploading ? 'Uploading...' : 'Change Profile Picture'}
          </Text>
        </Pressable>

        {profile?.avatarUrl && (
          <Pressable onPress={removeAvatar} disabled={uploading} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Use Default Avatar</Text>
          </Pressable>
        )}

        <Text style={styles.name}>{profile?.username || 'Loading...'}</Text>
        <Text style={styles.smallSubtitle}>My Tweeter Profile</Text>

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

          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.levelHint}>
            XP will later increase when users log birds, post sightings, and complete bird quizzes.
          </Text>
        </View>

        <Pressable onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  )
}

const styles = {
  centerScreen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    color: '#2f855a',
    fontSize: 34,
    fontWeight: 'bold' as const,
    marginBottom: 6,
    textAlign: 'center' as const,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 15,
    marginBottom: 22,
    textAlign: 'center' as const,
  },
  smallSubtitle: {
    color: '#6b7280',
    fontSize: 15,
    marginBottom: 22,
  },
  statusCard: {
    width: '100%' as const,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  statusText: {
    color: '#2f855a',
    fontSize: 17,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  statusSubtext: {
    color: '#6b7280',
    fontSize: 14,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 18,
    backgroundColor: '#d1d5db',
  },
  defaultAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 18,
    backgroundColor: '#2f855a',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  defaultAvatarText: {
    color: 'white',
    fontSize: 46,
    fontWeight: 'bold' as const,
  },
  avatarButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    marginBottom: 12,
  },
  avatarButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 15,
  },
  removeButton: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  removeButtonText: {
    color: '#2f855a',
    fontWeight: 'bold' as const,
    fontSize: 14,
  },
  name: {
    color: '#111827',
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  card: {
    width: '100%' as const,
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  label: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600' as const,
  },
  value: {
    color: '#111827',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  levelCard: {
    width: '100%' as const,
    backgroundColor: '#1f5138',
    padding: 22,
    borderRadius: 22,
    marginTop: 8,
    marginBottom: 22,
  },
  levelTitle: {
    color: '#d1fae5',
    fontSize: 15,
    marginBottom: 8,
  },
  levelNumber: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold' as const,
  },
  levelText: {
    color: '#bbf7d0',
    marginBottom: 14,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#276749',
    borderRadius: 999,
    overflow: 'hidden' as const,
    marginBottom: 12,
  },
  progressFill: {
    width: '0%' as const,
    height: '100%' as const,
    backgroundColor: '#86efac',
  },
  levelHint: {
    color: '#d1fae5',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 15,
    paddingHorizontal: 26,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  logoutButton: {
    width: '100%' as const,
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center' as const,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
}