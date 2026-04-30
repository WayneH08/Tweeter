import { useState } from 'react'
import { Alert, Button, Text, TextInput, View } from 'react-native'
import { supabase } from '@/lib/supabase/supabase'
import { router } from 'expo-router'
import ScreenWrapper from '@/components/ScreenWrapper'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      Alert.alert('Signup error', error.message)
    } else {
      Alert.alert('Success', 'Account created. Check your email if confirmation is required.')
    }
  }

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('LOGIN DATA:', data)
    console.log('LOGIN ERROR:', error)

    if (error) {
      Alert.alert('Login error', error.message)
    } else if (!data.session) {
      Alert.alert('Login issue', 'No session returned')
    } else {
      Alert.alert('Success', 'Logged in!')
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

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={{
            borderWidth: 1,
            padding: 12,
            marginBottom: 12,
            color: 'black',
          }}
        />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 1,
            padding: 12,
            marginBottom: 12,
            color: 'black',
          }}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            padding: 12,
            marginBottom: 12,
            color: 'black',
          }}
        />

        <Button title="Sign Up" onPress={signUp} />
        <View style={{ height: 12 }} />
        <Button title="Log In" onPress={signIn} />
      </View>
    </ScreenWrapper>
  )
}