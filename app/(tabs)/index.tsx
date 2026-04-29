import { useEffect, useState } from 'react'
import { Alert, Pressable, Text, TextInput, View, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase/supabase'

export default function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null)
  const [sightings, setSightings] = useState<any[]>([])

  const [birdName, setBirdName] = useState('')
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  async function checkSession() {
    const { data } = await supabase.auth.getSession()
    setUserId(data.session?.user?.id ?? null)
  }

  async function loadSightings() {
    const { data, error } = await supabase
      .from('sightings')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSightings(data)
    }
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

  async function createSighting() {
    if (!userId) {
      Alert.alert('Error', 'You are not logged in')
      return
    }

    if (!birdName || !latitude || !longitude) {
      Alert.alert('Missing info', 'Bird name, latitude, and longitude are required.')
      return
    }

    const latNumber = Number(latitude)
    const lngNumber = Number(longitude)

    if (Number.isNaN(latNumber) || Number.isNaN(lngNumber)) {
      Alert.alert('Invalid location', 'Latitude and longitude must be numbers.')
      return
    }

    const { error } = await supabase.from('sightings').insert({
      user_id: userId,
      bird_name: birdName,
      description,
      latitude: latNumber,
      longitude: lngNumber,
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Bird sighting created!')

      setBirdName('')
      setDescription('')
      setLatitude('')
      setLongitude('')

      loadSightings()
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUserId(null)
    router.push('/auth')
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
      }}
    >
      <Text style={{ color: 'black', fontSize: 32, fontWeight: 'bold' }}>
        Tweeter
      </Text>

      <Text style={{ color: 'black', marginTop: 12, marginBottom: 12 }}>
        {userId ? 'Logged in ✅' : 'Not logged in ❌'}
      </Text>

      {!userId && (
        <Pressable
          onPress={() => router.push('/auth')}
          style={{
            backgroundColor: 'black',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Go to Login
          </Text>
        </Pressable>
      )}

      {userId && (
        <>
          <TextInput
            placeholder="Bird name"
            value={birdName}
            onChangeText={setBirdName}
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 12,
              marginBottom: 10,
              color: 'black',
            }}
          />

          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 12,
              marginBottom: 10,
              color: 'black',
            }}
          />

          <TextInput
            placeholder="Latitude ex: 33.2148"
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numeric"
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 12,
              marginBottom: 10,
              color: 'black',
            }}
          />

          <TextInput
            placeholder="Longitude ex: -97.1331"
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numeric"
            style={{
              width: '100%',
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 12,
              marginBottom: 16,
              color: 'black',
            }}
          />

          <Pressable
            onPress={createSighting}
            style={{
              backgroundColor: 'black',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              Add Bird Sighting
            </Text>
          </Pressable>

          <Pressable onPress={logout} style={{ marginBottom: 20 }}>
            <Text style={{ color: 'red', fontWeight: 'bold' }}>
              Log Out
            </Text>
          </Pressable>

          <View style={{ width: '100%', marginTop: 10 }}>
            <Text style={{ color: 'black', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
              Recent Sightings
            </Text>

            {sightings.map((s) => (
              <View
                key={s.id}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: 'black', fontWeight: 'bold' }}>
                  🐦 {s.bird_name}
                </Text>

                <Text style={{ color: 'black' }}>
                  {s.description || 'No description'}
                </Text>

                <Text style={{ color: 'gray' }}>
                  {s.latitude}, {s.longitude}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
}