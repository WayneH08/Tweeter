import { useState } from 'react'
import {
  Alert,
  Button,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { supabase } from '@/lib/supabase/supabase'
import { router } from 'expo-router'
import ScreenWrapper from '@/components/ScreenWrapper'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  async function uploadAvatar(userId: string) {
    if (!avatarUri) return null

    const base64 = await FileSystem.readAsStringAsync(avatarUri, {
      encoding: 'base64',
    })

    const filePath = `${userId}/avatar-${Date.now()}.jpg`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      Alert.alert('Avatar upload error', error.message)
      return null
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function signUp() {
    if (!username.trim()) {
      Alert.alert('Missing username', 'Please enter a username.')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          avatar_url: null,
        },
      },
    })

    if (error) {
      Alert.alert('Signup error', error.message)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      Alert.alert('Signup issue', 'Account was created, but no user ID was returned.')
      return
    }

    let avatarUrl: string | null = null

    if (avatarUri) {
      avatarUrl = await uploadAvatar(userId)

      if (avatarUrl) {
        await supabase.auth.updateUser({
          data: {
            username: username.trim(),
            avatar_url: avatarUrl,
          },
        })
      }
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      username: username.trim(),
      avatar_url: avatarUrl,
    })

    if (profileError) {
      Alert.alert('Profile setup error', profileError.message)
      return
    }

    Alert.alert('Success', 'Account created.')
  }

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      Alert.alert('Login error', error.message)
    } else if (!data.session) {
      Alert.alert('Login issue', 'No session returned')
    } else {
      router.replace('/')
    }
  }

  return (
    <ScreenWrapper backgroundColor="#ffffff">
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 24,
            color: 'black',
          }}
        >
          Tweeter Login
        </Text>

        <Pressable onPress={pickAvatar} style={{ alignItems: 'center', marginBottom: 18 }}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
                marginBottom: 8,
              }}
            />
          ) : (
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
                backgroundColor: '#2f855a',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={{ color: 'white', fontSize: 34, fontWeight: 'bold' }}>
                {username.trim().charAt(0).toUpperCase() || 'T'}
              </Text>
            </View>
          )}

          <Text style={{ color: '#2f855a', fontWeight: 'bold' }}>
            Add Profile Picture (Optional)
          </Text>
        </Pressable>

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
        />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
        />

        <Button title="Sign Up" onPress={signUp} />
        <View style={{ height: 12 }} />
        <Button title="Log In" onPress={signIn} />
      </View>
    </ScreenWrapper>
  )
}