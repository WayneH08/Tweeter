import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase/supabase'
import SightingForm from '@/components/SightingForm'
import SightingCard from '@/components/SightingCard'
import { fetchSightings, type Sighting } from '@/lib/sightings'

export default function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null)
  const [sightings, setSightings] = useState<Sighting[]>([])

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

  return (
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
          <SightingForm userId={userId} onSightingCreated={loadSightings} />

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
                <SightingCard key={sighting.id} sighting={sighting} />
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}