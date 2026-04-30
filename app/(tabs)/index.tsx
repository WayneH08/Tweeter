import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase/supabase'
import SightingForm from '@/components/SightingForm'
import SightingCard from '@/components/SightingCard'
import { fetchSightings, type Sighting } from '@/lib/sightings'
import ScreenWrapper from '@/components/ScreenWrapper'

export default function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null)
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [postModalVisible, setPostModalVisible] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [username, setUsername] = useState('T')

  async function checkSession() {
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user ?? null

    setUserId(user?.id ?? null)

    if (!user) {
      setAvatarUrl(null)
      setUsername('T')
      return
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    setAvatarUrl(profileRow?.avatar_url || user.user_metadata?.avatar_url || null)
    setUsername(
      profileRow?.username ||
        user.user_metadata?.username ||
        user.email?.split('@')[0] ||
        'T'
    )
  }

  async function loadSightings() {
    const { data, error } = await fetchSightings()

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setSightings(data ?? [])
  }

  useEffect(() => {
    checkSession()
    loadSightings()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
      checkSession()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      checkSession()
      loadSightings()
    }, [])
  )

  async function handleSightingCreated() {
    await loadSightings()
    setPostModalVisible(false)
  }

  return (
    <ScreenWrapper>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#f3f4f6' }}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 4,
          paddingBottom: 130,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (userId) {
                setPostModalVisible(true)
              } else {
                router.push('/auth')
              }
            }}
            style={styles.addButton}
          >
            <Ionicons name="add" size={30} color="white" />
          </Pressable>

          <View style={styles.logoBlock}>
            <Text style={styles.logo}>Tweeter</Text>
            <Text style={styles.tagline}>Bird sightings near you</Text>
          </View>

          <Pressable
            onPress={() => router.push(userId ? '/profile' : '/auth')}
            style={styles.profileButton}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
            ) : (
              <Text style={styles.profileInitial}>
                {username.charAt(0).toUpperCase()}
              </Text>
            )}
          </Pressable>
        </View>

        {!userId && (
          <Pressable onPress={() => router.push('/auth')} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Log In to Post</Text>
          </Pressable>
        )}

        {userId && (
          <View>
            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>Recent Sightings</Text>
              <Text style={styles.feedSubtitle}>Tap any post to expand</Text>
            </View>

            {sightings.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No sightings yet</Text>
                <Text style={styles.emptyText}>
                  Be the first to share a bird sighting.
                </Text>
              </View>
            ) : (
              sightings.map((sighting) => (
                <SightingCard
                  key={sighting.id}
                  sighting={sighting}
                  currentUserId={userId}
                  onDeleted={loadSightings}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={postModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setPostModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>New Sighting</Text>

                  <Pressable onPress={() => setPostModalVisible(false)}>
                    <Text style={styles.modalClose}>Close</Text>
                  </Pressable>
                </View>

                {userId && (
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      padding: 20,
                      paddingBottom: 40,
                    }}
                  >
                    <SightingForm
                      userId={userId}
                      onSightingCreated={handleSightingCreated}
                    />
                  </ScrollView>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  )
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2f855a',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  logoBlock: {
    alignItems: 'center' as const,
  },
  logo: {
    color: '#1f5138',
    fontSize: 34,
    fontWeight: '900' as const,
    letterSpacing: 0.2,
  },
  tagline: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600' as const,
    marginTop: -2,
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2f855a',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  profileInitial: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center' as const,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 17,
  },
  feedHeader: {
    marginBottom: 12,
  },
  feedTitle: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '900' as const,
  },
  feedSubtitle: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center' as const,
    padding: 16,
  },
  modalCard: {
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
}