import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase/supabase'
import ScreenWrapper from '@/components/ScreenWrapper'
import type { Sighting } from '@/lib/sightings'

type ProfileData = {
  userId: string
  username: string
  avatarUrl: string | null
  bio: string | null
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [bioModalVisible, setBioModalVisible] = useState(false)
  const [bioDraft, setBioDraft] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const [userSightings, setUserSightings] = useState<Sighting[]>([])
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null)

  const photoSightings = useMemo(() => {
    return userSightings.filter((sighting) => !!sighting.photo_url)
  }, [userSightings])

  const uniqueBirdCount = useMemo(() => {
    const birdNames = userSightings
      .map((sighting) => sighting.bird_name?.trim().toLowerCase())
      .filter(Boolean)

    return new Set(birdNames).size
  }, [userSightings])

  useEffect(() => {
    loadProfile()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)

      if (session?.user) {
        loadProfile()
      } else {
        setProfile(null)
        setUserSightings([])
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
      setUserSightings([])
      return
    }

    setIsLoggedIn(true)

    const fallbackUsername =
      user.user_metadata?.username ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Tweeter User'

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('username, avatar_url, bio')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      Alert.alert('Profile error', profileError.message)
      return
    }

    const finalUsername = profileRow?.username || fallbackUsername
    const finalAvatarUrl =
      profileRow?.avatar_url || user.user_metadata?.avatar_url || null
    const finalBio = profileRow?.bio || null

    await supabase.from('profiles').upsert(
      {
        id: user.id,
        username: finalUsername,
        avatar_url: finalAvatarUrl,
        bio: finalBio,
      },
      { onConflict: 'id' }
    )

    setProfile({
      userId: user.id,
      username: finalUsername,
      avatarUrl: finalAvatarUrl,
      bio: finalBio,
    })

    setBioDraft(finalBio || '')
    await loadUserSightings(user.id)
  }

  async function loadUserSightings(userId: string) {
    const { data, error } = await supabase
      .from('sightings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      Alert.alert('Sightings error', error.message)
      return
    }

    setUserSightings((data ?? []) as Sighting[])
  }

  function showAvatarOptions() {
    if (!profile || uploading) return

    const buttons = profile.avatarUrl
      ? [
          {
            text: 'Edit Profile Photo',
            onPress: pickAndUploadAvatar,
          },
          {
            text: 'Remove Profile Photo',
            style: 'destructive' as const,
            onPress: removeAvatar,
          },
          {
            text: 'Cancel',
            style: 'cancel' as const,
          },
        ]
      : [
          {
            text: 'Edit Profile Photo',
            onPress: pickAndUploadAvatar,
          },
          {
            text: 'Cancel',
            style: 'cancel' as const,
          },
        ]

    Alert.alert('Profile Picture', 'What would you like to do?', buttons)
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
        bio: profile.bio,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      Alert.alert('Profile table error', profileError.message)
      return false
    }

    const { error: sightingsError } = await supabase
      .from('sightings')
      .update({
        username: profile.username,
        avatar_url: avatarUrl,
      })
      .eq('user_id', profile.userId)

    if (sightingsError) {
      Alert.alert('Sightings update warning', sightingsError.message)
    }

    setProfile({
      ...profile,
      avatarUrl,
    })

    setUserSightings((currentSightings) =>
      currentSightings.map((sighting) => ({
        ...sighting,
        avatar_url: avatarUrl,
        username: profile.username,
      }))
    )

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

  function openBioEditor() {
    setBioDraft(profile?.bio || '')
    setBioModalVisible(true)
  }

  async function saveBio() {
    if (!profile || savingBio) return

    try {
      setSavingBio(true)

      const cleanedBio = bioDraft.trim()

      const { error } = await supabase
        .from('profiles')
        .update({
          bio: cleanedBio.length > 0 ? cleanedBio : null,
        })
        .eq('id', profile.userId)

      if (error) {
        Alert.alert('Bio update error', error.message)
        return
      }

      setProfile({
        ...profile,
        bio: cleanedBio.length > 0 ? cleanedBio : null,
      })

      setBioModalVisible(false)
    } finally {
      setSavingBio(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
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
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>

          <Text style={styles.headerTitle}>Profile</Text>

          <Pressable onPress={() => router.push('/settings')} style={styles.iconButton}>
            <Ionicons name="settings-outline" size={24} color="#111827" />
          </Pressable>
        </View>

        <View style={styles.profileHeader}>
          <Pressable onPress={showAvatarOptions} style={styles.avatarWrap}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.defaultAvatarText}>
                  {profile?.username?.charAt(0).toUpperCase() || 'T'}
                </Text>
              </View>
            )}

            <View style={[styles.editAvatarButton, uploading && { opacity: 0.6 }]}>
              <Ionicons name="pencil" size={17} color="white" />
            </View>
          </Pressable>

          <Text style={styles.username}>{profile?.username || 'Loading...'}</Text>
          <Text style={styles.handle}>@{profile?.username || 'tweeteruser'}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userSightings.length}</Text>
            <Text style={styles.statLabel}>Sightings</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{uniqueBirdCount}</Text>
            <Text style={styles.statLabel}>Birds</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        <View style={styles.bioCard}>
          <View style={styles.bioHeader}>
            <Text style={styles.bioTitle}>About</Text>

            <Pressable onPress={openBioEditor} style={styles.bioEditButton}>
              <Ionicons name="pencil-outline" size={17} color="#2f855a" />
            </Pressable>
          </View>

          <Pressable onPress={openBioEditor}>
            <Text
              style={[
                styles.bioText,
                !profile?.bio && {
                  color: '#9ca3af',
                  fontStyle: 'italic',
                },
              ]}
            >
              {profile?.bio ||
                'Tap here to add a short bio about your birding interests.'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelTopRow}>
            <View>
              <Text style={styles.levelTitle}>Birding Level</Text>
              <Text style={styles.levelNumber}>Level 1</Text>
            </View>

            <View style={styles.levelBadge}>
              <Ionicons name="leaf-outline" size={20} color="#14532d" />
            </View>
          </View>

          <Text style={styles.levelText}>0 XP</Text>

          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.levelHint}>
            XP will later increase when users log birds, post sightings, and complete bird quizzes.
          </Text>
        </View>

        <View style={styles.postsSectionHeader}>
          <Text style={styles.postsTitle}>Public Posts</Text>
          <Text style={styles.postsSubtitle}>
            {photoSightings.length} photo {photoSightings.length === 1 ? 'post' : 'posts'}
          </Text>
        </View>

        {photoSightings.length === 0 ? (
          <View style={styles.emptyPostsCard}>
            <Ionicons name="grid-outline" size={28} color="#6b7280" />
            <Text style={styles.emptyPostsTitle}>No public photo posts yet</Text>
            <Text style={styles.emptyPostsText}>
              Bird sightings with photos will show here in a profile grid.
            </Text>
          </View>
        ) : (
          <View style={styles.postsGrid}>
            {photoSightings.map((sighting) => (
              <Pressable
                key={sighting.id}
                onPress={() => setSelectedSighting(sighting)}
                style={styles.gridPost}
              >
                <Image source={{ uri: sighting.photo_url! }} style={styles.gridImage} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={bioModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setBioModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.bioModalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit About</Text>

                <Pressable onPress={() => setBioModalVisible(false)}>
                  <Text style={styles.modalClose}>Close</Text>
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.bioModalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.bioInputLabel}>Profile Bio</Text>

                <TextInput
                  value={bioDraft}
                  onChangeText={setBioDraft}
                  placeholder="Write a short bio about your birding interests..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  maxLength={160}
                  style={styles.bioInput}
                />

                <Text style={styles.characterCount}>{bioDraft.length}/160</Text>

                <Pressable
                  onPress={saveBio}
                  disabled={savingBio}
                  style={[styles.saveBioButton, savingBio && { opacity: 0.6 }]}
                >
                  <Text style={styles.saveBioButtonText}>
                    {savingBio ? 'Saving...' : 'Save Bio'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!selectedSighting}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedSighting(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.postDetailCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sighting</Text>

              <Pressable onPress={() => setSelectedSighting(null)}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            {selectedSighting && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedSighting.photo_url && (
                  <Image
                    source={{ uri: selectedSighting.photo_url }}
                    style={styles.detailImage}
                  />
                )}

                <View style={styles.detailContent}>
                  <View style={styles.detailUserRow}>
                    {selectedSighting.avatar_url ? (
                      <Image
                        source={{ uri: selectedSighting.avatar_url }}
                        style={styles.detailAvatar}
                      />
                    ) : (
                      <View style={styles.detailDefaultAvatar}>
                        <Text style={styles.detailDefaultAvatarText}>
                          {(selectedSighting.username || profile?.username || 'T')
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailUsername}>
                        {selectedSighting.username || profile?.username || 'Tweeter User'}
                      </Text>
                      <Text style={styles.detailDate}>
                        {formatDate(selectedSighting.created_at)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailBirdName}>{selectedSighting.bird_name}</Text>

                  {!!selectedSighting.description && (
                    <Text style={styles.detailDescription}>
                      {selectedSighting.description}
                    </Text>
                  )}

                  {!!selectedSighting.location_name && (
                    <View style={styles.detailInfoRow}>
                      <Ionicons name="location-outline" size={18} color="#2f855a" />
                      <Text style={styles.detailInfoText}>
                        {selectedSighting.location_name}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailInfoRow}>
                    <Ionicons name="map-outline" size={18} color="#2f855a" />
                    <Text style={styles.detailInfoText}>
                      {selectedSighting.latitude.toFixed(4)},{' '}
                      {selectedSighting.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  topBar: {
    width: '100%' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 22,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'white',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  profileHeader: {
    alignItems: 'center' as const,
    marginBottom: 22,
  },
  avatarWrap: {
    position: 'relative' as const,
    marginBottom: 14,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#d1d5db',
    borderWidth: 4,
    borderColor: 'white',
  },
  defaultAvatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#2f855a',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 4,
    borderColor: 'white',
  },
  defaultAvatarText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold' as const,
  },
  editAvatarButton: {
    position: 'absolute' as const,
    right: 4,
    bottom: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2f855a',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 3,
    borderColor: 'white',
  },
  username: {
    color: '#111827',
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginBottom: 3,
  },
  handle: {
    color: '#6b7280',
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    color: '#111827',
    fontSize: 22,
    fontWeight: 'bold' as const,
    marginBottom: 3,
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  bioCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bioHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 6,
  },
  bioTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  bioEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  bioText: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
  },
  levelCard: {
    width: '100%' as const,
    backgroundColor: '#1f5138',
    padding: 22,
    borderRadius: 24,
    marginBottom: 18,
  },
  levelTopRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  levelTitle: {
    color: '#d1fae5',
    fontSize: 15,
    marginBottom: 6,
  },
  levelNumber: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold' as const,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#bbf7d0',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
  postsSectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    marginBottom: 12,
  },
  postsTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900' as const,
  },
  postsSubtitle: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  postsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 4,
  },
  gridPost: {
    width: '32.5%' as const,
    aspectRatio: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  gridImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  emptyPostsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyPostsTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: 'bold' as const,
    marginTop: 10,
    marginBottom: 5,
  },
  emptyPostsText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center' as const,
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
  keyboardAvoidingView: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  bioModalCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden' as const,
    maxHeight: '82%' as const,
  },
  bioModalScrollContent: {
    padding: 20,
    paddingBottom: 34,
  },
  postDetailCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    maxHeight: '88%' as const,
    overflow: 'hidden' as const,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111827',
  },
  modalClose: {
    color: '#dc2626',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  bioInputLabel: {
    color: '#111827',
    fontSize: 15,
    fontWeight: 'bold' as const,
    marginBottom: 8,
  },
  bioInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    padding: 14,
    color: '#111827',
    fontSize: 15,
    textAlignVertical: 'top' as const,
    backgroundColor: '#f9fafb',
  },
  characterCount: {
    textAlign: 'right' as const,
    color: '#6b7280',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 14,
  },
  saveBioButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center' as const,
  },
  saveBioButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  detailImage: {
    width: '100%' as const,
    height: 360,
    backgroundColor: '#e5e7eb',
  },
  detailContent: {
    padding: 18,
  },
  detailUserRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 16,
  },
  detailAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#d1d5db',
  },
  detailDefaultAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2f855a',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  detailDefaultAvatarText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  detailUsername: {
    color: '#111827',
    fontSize: 15,
    fontWeight: 'bold' as const,
  },
  detailDate: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  detailBirdName: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '900' as const,
    marginBottom: 8,
  },
  detailDescription: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
  },
  detailInfoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 8,
  },
  detailInfoText: {
    color: '#374151',
    fontSize: 14,
    flex: 1,
  },
}