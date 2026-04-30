import { useEffect, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase/supabase'
import SightingForm from '@/components/SightingForm'
import SightingCard from '@/components/SightingCard'
import { fetchSightings, type Sighting } from '@/lib/sightings'

export default function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null)
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [postModalVisible, setPostModalVisible] = useState(false)

  async function checkSession() {
    const { data } = await supabase.auth.getSession()
    setUserId(data.session?.user?.id ?? null)
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
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    setUserId(null)
    router.push('/auth')
  }

  async function handleSightingCreated() {
    await loadSightings()
    setPostModalVisible(false)
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#f3f4f6' }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 120,
        }}
      >
        <Text
          style={{
            color: '#111827',
            fontSize: 34,
            fontWeight: 'bold',
            marginBottom: 6,
          }}
        >
          Tweeter
        </Text>

        <Text style={{ color: '#374151', marginBottom: 20 }}>
          {userId ? 'Logged in ✅' : 'Not logged in ❌'}
        </Text>

        {!userId && (
          <Pressable
            onPress={() => router.push('/auth')}
            style={{
              backgroundColor: '#111827',
              paddingVertical: 14,
              borderRadius: 10,
              marginBottom: 20,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              Go to Login
            </Text>
          </Pressable>
        )}

        {userId && (
          <>
            <Pressable
              onPress={() => setPostModalVisible(true)}
              style={{
                backgroundColor: '#2f855a',
                paddingVertical: 14,
                borderRadius: 12,
                marginBottom: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                + Post a Bird Sighting
              </Text>
            </Pressable>

            <Pressable onPress={logout} style={{ marginBottom: 24 }}>
              <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 16 }}>
                Log Out
              </Text>
            </Pressable>

            <View style={{ width: '100%' }}>
              <Text
                style={{
                  color: '#111827',
                  fontSize: 26,
                  fontWeight: 'bold',
                  marginBottom: 12,
                }}
              >
                Recent Sightings
              </Text>

              {sightings.length === 0 ? (
                <Text style={{ color: '#6b7280' }}>
                  No sightings yet.
                </Text>
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
          </>
        )}
      </ScrollView>

      <Modal
        visible={postModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '88%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
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
              <ScrollView showsVerticalScrollIndicator={false}>
                <SightingForm
                  userId={userId}
                  onSightingCreated={handleSightingCreated}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  )
}