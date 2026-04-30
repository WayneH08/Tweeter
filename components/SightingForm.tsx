import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import * as Location from 'expo-location'
import { decode } from 'base64-arraybuffer'
import { supabase } from '@/lib/supabase/supabase'
import { createSighting } from '@/lib/sightings'

type LocationSuggestion = {
  display_name: string
  lat: string
  lon: string
}

export default function SightingForm({
  userId,
  onSightingCreated,
}: {
  userId: string
  onSightingCreated: () => void
}) {
  const [birdName, setBirdName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<string | null>(null)

  const [locationText, setLocationText] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (locationText.trim().length < 3) {
      setSuggestions([])
      return
    }

    const timeout = setTimeout(() => {
      searchLocations(locationText)
    }, 500)

    return () => clearTimeout(timeout)
  }, [locationText])

  async function searchLocations(query: string) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5`

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TweeterBirdApp/1.0',
        },
      })

      const data = await response.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  async function uploadImage() {
    if (!image) return null

    const base64 = await FileSystem.readAsStringAsync(image, {
      encoding: 'base64',
    })

    const filePath = `${userId}/${Date.now()}.jpg`

    const { error } = await supabase.storage
      .from('bird-photos')
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      Alert.alert('Upload error', error.message)
      return null
    }

    const { data } = supabase.storage
      .from('bird-photos')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function getUserMeta() {
    const { data } = await supabase.auth.getUser()
    const user = data.user

    return {
      username:
        user?.user_metadata?.username ||
        user?.email?.split('@')[0] ||
        'user',
      avatar_url: user?.user_metadata?.avatar_url || null,
    }
  }

  function formatReverseLocation(place: Location.LocationGeocodedAddress) {
    const parts = [
      place.city,
      place.region,
      place.country,
    ].filter(Boolean)

    return parts.join(', ') || 'Current location'
  }

  async function useCurrentLocation() {
    try {
      setLoadingLocation(true)

      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Please allow location access to use your current location.'
        )
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({})

      const lat = currentLocation.coords.latitude
      const lon = currentLocation.coords.longitude

      setLatitude(lat)
      setLongitude(lon)

      const reverse = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      })

      if (reverse.length > 0) {
        setLocationText(formatReverseLocation(reverse[0]))
      } else {
        setLocationText('Current location')
      }

      setSuggestions([])
    } catch {
      Alert.alert('Location error', 'Could not get your current location.')
    } finally {
      setLoadingLocation(false)
    }
  }

  function chooseSuggestion(suggestion: LocationSuggestion) {
    setLocationText(suggestion.display_name)
    setLatitude(Number(suggestion.lat))
    setLongitude(Number(suggestion.lon))
    setSuggestions([])
  }

  async function geocodeTypedLocation() {
    if (!locationText.trim()) return false

    if (latitude !== null && longitude !== null) return true

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        locationText
      )}&limit=1`

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TweeterBirdApp/1.0',
        },
      })

      const data = await response.json()

      if (!data || data.length === 0) {
        Alert.alert(
          'Location not found',
          'Please choose a suggested location or type a more complete city/address.'
        )
        return false
      }

      setLatitude(Number(data[0].lat))
      setLongitude(Number(data[0].lon))
      setLocationText(data[0].display_name)

      return true
    } catch {
      Alert.alert('Location error', 'Could not find that location.')
      return false
    }
  }

  async function handleSubmit() {
    if (!birdName.trim()) {
      Alert.alert('Missing info', 'Please enter a bird name.')
      return
    }

    if (!locationText.trim()) {
      Alert.alert(
        'Missing location',
        'Please use your current location or type a city/address.'
      )
      return
    }

    setSubmitting(true)

    try {
      const locationReady = await geocodeTypedLocation()

      if (!locationReady) return

      const photoUrl = await uploadImage()
      const { username, avatar_url } = await getUserMeta()

      const { error } = await createSighting({
        user_id: userId,
        username,
        bird_name: birdName.trim(),
        description: description.trim(),
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
        location_name: locationText.trim(),
        photo_url: photoUrl,
        avatar_url,
      })

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      setBirdName('')
      setDescription('')
      setImage(null)
      setLocationText('')
      setLatitude(null)
      setLongitude(null)
      setSuggestions([])

      onSightingCreated()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View>
      <Text style={styles.label}>Bird name</Text>
      <TextInput
        placeholder="Example: Northern Cardinal"
        placeholderTextColor="#9ca3af"
        value={birdName}
        onChangeText={setBirdName}
        style={styles.input}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        placeholder="What did you see?"
        placeholderTextColor="#9ca3af"
        value={description}
        onChangeText={setDescription}
        multiline
        style={[styles.input, styles.textArea]}
      />

      <Text style={styles.label}>Location</Text>

      <Pressable
        onPress={useCurrentLocation}
        disabled={loadingLocation}
        style={styles.locationButton}
      >
        <Text style={styles.locationButtonText}>
          {loadingLocation ? 'Getting location...' : 'Use Current Location'}
        </Text>
      </Pressable>

      <TextInput
        placeholder="Or type a city/address"
        placeholderTextColor="#9ca3af"
        value={locationText}
        onChangeText={(text) => {
          setLocationText(text)
          setLatitude(null)
          setLongitude(null)
        }}
        style={styles.input}
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {suggestions.map((item, index) => (
            <Pressable
              key={`${item.lat}-${item.lon}-${index}`}
              onPress={() => chooseSuggestion(item)}
              style={styles.suggestionItem}
            >
              <Text style={styles.suggestionText}>{item.display_name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {latitude !== null && longitude !== null && (
        <Text style={styles.coords}>
          Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
      )}

      <Text style={styles.label}>Photo</Text>

      <Pressable onPress={pickImage} style={styles.imageButton}>
        <Text style={styles.imageButtonText}>
          {image ? 'Change Image' : 'Pick Image'}
        </Text>
      </Pressable>

      {image && (
        <Image
          source={{ uri: image }}
          style={{
            width: '100%',
            height: 220,
            borderRadius: 14,
            marginBottom: 16,
          }}
        />
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        style={[
          styles.submitButton,
          submitting && { opacity: 0.7 },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Sighting</Text>
        )}
      </Pressable>
    </View>
  )
}

const styles = {
  label: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top' as const,
  },
  locationButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center' as const,
  },
  locationButtonText: {
    color: 'white',
    fontWeight: '700' as const,
    fontSize: 15,
  },
  suggestionBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 14,
    overflow: 'hidden' as const,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  suggestionText: {
    color: '#111827',
    fontSize: 14,
  },
  coords: {
    color: '#4b5563',
    fontSize: 13,
    marginBottom: 14,
  },
  imageButton: {
    backgroundColor: '#2f855a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center' as const,
  },
  imageButtonText: {
    color: 'white',
    fontWeight: '700' as const,
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
}