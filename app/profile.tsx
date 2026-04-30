import { useEffect, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
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

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) return

    const fallbackUsername =
      user.user_metadata?.username ||
      user.user_metadata?.name ||
      'Tweeter User'

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    const finalUsername = profileRow?.username || fallbackUsername
    const finalAvatarUrl =
      profileRow?.avatar_url || user.user_metadata?.avatar_url || null

    await supabase.from('profiles').upsert({
      id: user.id,
      username: finalUsername,
      avatar_url: finalAvatarUrl,
    })

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

  async function pickAndUploadAvatar() {
    if (!profile?.userId) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (result.canceled) return

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

    const avatarUrl = data.publicUrl

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        username: profile.username,
        avatar_url: avatarUrl,
      },
    })

    if (authError) {
      Alert.alert('Profile update error', authError.message)
      return
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: profile.userId,
      username: profile.username,
      avatar_url: avatarUrl,
    })

    if (profileError) {
      Alert.alert('Profile table error', profileError.message)
      return
    }

    setProfile({
      ...profile,
      avatarUrl,
    })

    Alert.alert('Success', 'Profile picture updated.')
  }

  async function removeAvatar() {
    if (!profile) return

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        username: profile.username,
        avatar_url: null,
      },
    })

    if (authError) {
      Alert.alert('Profile update error', authError.message)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: profile.userId,
        username: profile.username,
        avatar_url: null,
      })

    if (profileError) {
      Alert.alert('Profile table error', profileError.message)
      return
    }

    setProfile({
      ...profile,
      avatarUrl: null,
    })

    Alert.alert('Success', 'Profile picture removed.')
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
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.defaultAvatarText}>
              {profile?.username?.charAt(0).toUpperCase() || 'T'}
            </Text>
          </View>
        )}

        <Pressable onPress={pickAndUploadAvatar} style={styles.avatarButton}>
          <Text style={styles.avatarButtonText}>Change Profile Picture</Text>
        </Pressable>

        {profile?.avatarUrl && (
          <Pressable onPress={removeAvatar} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Use Default Avatar</Text>
          </Pressable>
        )}

        <Text style={styles.name}>{profile?.username || 'Loading...'}</Text>

        <Text style={styles.subtitle}>My Tweeter Profile</Text>

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
      </ScrollView>
    </ScreenWrapper>
  )
}

const styles = {
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
    fontSize: 48,
    fontWeight: 'bold' as const,
  },
  avatarButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  avatarButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
  },
  removeButton: {
    marginTop: 10,
  },
  removeButtonText: {
    color: '#dc2626',
    fontWeight: 'bold' as const,
  },
  name: {
    fontSize: 30,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 6,
    marginTop: 16,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 16,
    marginBottom: 28,
  },
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
  progressBar: {
    width: '100%' as const,
    height: 10,
    backgroundColor: '#d1d5db',
    borderRadius: 999,
    marginTop: 12,
    overflow: 'hidden' as const,
  },
  progressFill: {
    width: '0%' as const,
    height: '100%' as const,
    backgroundColor: '#2f855a',
  },
  levelHint: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
}