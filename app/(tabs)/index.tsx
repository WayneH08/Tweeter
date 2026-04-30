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
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 120,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <Pressable
            onPress={() => {
              if (userId) {
                setPostModalVisible(true)
              } else {
                router.push('/auth')
              }
            }}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#2f855a',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={28} color="white" />
          </Pressable>

          <Text
            style={{
              color: '#1f5138',
              fontSize: 32,
              fontWeight: 'bold',
              letterSpacing: 0.3,
            }}
          >
            Tweeter
          </Text>

          <Pressable
            onPress={() => router.push(userId ? '/profile' : '/auth')}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: '#2f855a',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: 'white',
            }}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                }}
              />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                {username.charAt(0).toUpperCase()}
              </Text>
            )}
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: '#ecfdf5',
            borderColor: '#bbf7d0',
            borderWidth: 1,
            borderRadius: 18,
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 22,
          }}
        >
          <Text
            style={{
              color: '#1f5138',
              fontSize: 15,
              fontWeight: '600',
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Bird sightings, profiles, and community posts.
          </Text>
        </View>

        {!userId && (
          <Pressable
            onPress={() => router.push('/auth')}
            style={{
              backgroundColor: '#2f855a',
              paddingVertical: 15,
              borderRadius: 16,
              marginBottom: 24,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>
              Log In to Post
            </Text>
          </Pressable>
        )}

        {userId && (
          <View style={{ width: '100%' }}>
            <Text
              style={{
                color: '#111827',
                fontSize: 28,
                fontWeight: 'bold',
                marginBottom: 14,
              }}
            >
              Recent Sightings
            </Text>

            {sightings.length === 0 ? (
              <Text style={{ color: '#6b7280' }}>No sightings yet.</Text>
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
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.55)',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <View
                style={{
                  backgroundColor: 'white',
                  borderRadius: 24,
                  maxHeight: '88%',
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e7eb',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: '#111827',
                    }}
                  >
                    New Sighting
                  </Text>

                  <Pressable onPress={() => setPostModalVisible(false)}>
                    <Text
                      style={{
                        color: '#dc2626',
                        fontWeight: 'bold',
                        fontSize: 16,
                      }}
                    >
                      Close
                    </Text>
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