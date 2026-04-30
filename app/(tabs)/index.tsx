import { useEffect, useState } from 'react'
import {
  Alert,
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
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase/supabase'
import SightingForm from '@/components/SightingForm'
import SightingCard from '@/components/SightingCard'
import { fetchSightings, type Sighting } from '@/lib/sightings'
import ScreenWrapper from '@/components/ScreenWrapper'

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
    <ScreenWrapper>
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
          </>
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