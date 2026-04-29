import { useState } from 'react'
import {
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase/supabase'
import { createSighting } from '@/lib/sightings'
import { uploadSightingPhoto } from '@/lib/uploads'

type Props = {
  userId: string
  onSightingCreated: () => void
}

export default function SightingForm({ userId, onSightingCreated }: Props) {
  const [birdName, setBirdName] = useState('')
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [locationName, setLocationName] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  const [gettingLocation, setGettingLocation] = useState(false)
  const [saving, setSaving] = useState(false)

  async function getCurrentLocation() {
    try {
      setGettingLocation(true)

      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.')
        return
      }

      const location = await Location.getCurrentPositionAsync({})

      const lat = location.coords.latitude
      const lng = location.coords.longitude

      setLatitude(lat.toString())
      setLongitude(lng.toString())

      const places = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      })

      const place = places[0]

      const city = place?.city || place?.district || 'Unknown city'
      const region = place?.region || ''
      const country = place?.country || ''

      const fullLocation = [city, region, country]
        .filter(Boolean)
        .join(', ')

      setLocationName(fullLocation)
    } catch (error) {
      console.log(error)
      Alert.alert('Error', 'Could not get your location.')
    } finally {
      setGettingLocation(false)
    }
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Photo permission is required.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    })

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri)
    }
  }

  async function handleCreateSighting() {
    if (!birdName || !latitude || !longitude) {
      Alert.alert('Missing info', 'Bird name and location are required.')
      return
    }

    const latNumber = Number(latitude)
    const lngNumber = Number(longitude)

    if (Number.isNaN(latNumber) || Number.isNaN(lngNumber)) {
      Alert.alert('Invalid location', 'Latitude and longitude must be numbers.')
      return
    }

    try {
      setSaving(true)

      const { data: userData } = await supabase.auth.getUser()

      const email = userData.user?.email || 'Unknown user'
      const username = email.split('@')[0]

      let photoUrl: string | null = null

      if (photoUri) {
        photoUrl = await uploadSightingPhoto(photoUri, userId)
      }

      const { error } = await createSighting({
        user_id: userId,
        username,
        bird_name: birdName,
        description,
        latitude: latNumber,
        longitude: lngNumber,
        location_name: locationName || 'Unknown location',
        photo_url: photoUrl,
      })

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      Alert.alert('Success', 'Bird sighting created!')

      setBirdName('')
      setDescription('')
      setLatitude('')
      setLongitude('')
      setLocationName('')
      setPhotoUri(null)

      onSightingCreated()
    } catch (error: any) {
      console.log(error)
      Alert.alert('Error', error.message || 'Could not save sighting.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ width: '100%' }}>
      <Text style={styles.title}>Add Bird Sighting</Text>

      <TextInput
        placeholder="Bird name"
        placeholderTextColor="#6b7280"
        value={birdName}
        onChangeText={setBirdName}
        style={styles.input}
      />

      <TextInput
        placeholder="Description / notes"
        placeholderTextColor="#6b7280"
        value={description}
        onChangeText={setDescription}
        multiline
        style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
      />

      <Pressable onPress={pickPhoto} style={styles.photoButton}>
        <Text style={styles.buttonText}>
          {photoUri ? 'Change Photo' : 'Choose Photo'}
        </Text>
      </Pressable>

      {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImage} />}

      <Pressable
        onPress={getCurrentLocation}
        disabled={gettingLocation}
        style={[
          styles.locationButton,
          { backgroundColor: gettingLocation ? '#6b7280' : '#2563eb' },
        ]}
      >
        <Text style={styles.buttonText}>
          {gettingLocation ? 'Getting Location...' : 'Use My Current Location'}
        </Text>
      </Pressable>

      {locationName ? (
        <Text style={styles.locationText}>📍 {locationName}</Text>
      ) : null}

      <TextInput
        placeholder="Latitude"
        placeholderTextColor="#6b7280"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Longitude"
        placeholderTextColor="#6b7280"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
        style={styles.input}
      />

      <Pressable
        onPress={handleCreateSighting}
        disabled={saving}
        style={[
          styles.submitButton,
          { backgroundColor: saving ? '#6b7280' : '#16a34a' },
        ]}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Adding...' : 'Add Sighting'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = {
  title: {
    color: '#111827',
    fontSize: 26,
    fontWeight: 'bold' as const,
    marginBottom: 16,
  },
  input: {
    width: '100%' as const,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#9ca3af',
    color: '#111827',
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  photoButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%' as const,
    alignItems: 'center' as const,
  },
  locationButton: {
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%' as const,
    alignItems: 'center' as const,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 18,
    width: '100%' as const,
    alignItems: 'center' as const,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  previewImage: {
    width: '100%' as const,
    height: 220,
    borderRadius: 10,
    marginBottom: 12,
  },
  locationText: {
    color: '#111827',
    fontSize: 15,
    marginBottom: 10,
    fontWeight: '600' as const,
  },
}