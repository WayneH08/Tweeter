import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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

type AuthMode = 'options' | 'login' | 'signup'

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('options')

  const [loginInput, setLoginInput] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

    return data.publicUrl
  }

  async function usernameAlreadyTaken(cleanUsername: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (error) {
      Alert.alert('Username check error', error.message)
      return true
    }

    return !!data
  }

  function isDuplicateUsernameError(message: string) {
    return (
      message.includes('unique_username') ||
      message.toLowerCase().includes('duplicate key') ||
      message.toLowerCase().includes('profiles_username_key')
    )
  }

  async function signUp() {
    if (loading) return

    const cleanUsername = username.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanUsername) {
      Alert.alert('Missing username', 'Please enter a username.')
      return
    }

    if (!cleanEmail) {
      Alert.alert('Missing email', 'Please enter an email.')
      return
    }

    if (!password) {
      Alert.alert('Missing password', 'Please enter a password.')
      return
    }

    setLoading(true)

    const taken = await usernameAlreadyTaken(cleanUsername)

    if (taken) {
      setLoading(false)
      Alert.alert('Username taken', 'That username is already in use. Please choose another one.')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
          avatar_url: null,
        },
      },
    })

    if (error) {
      setLoading(false)
      Alert.alert('Signup error', error.message)
      return
    }

    const userId = data.user?.id

    if (!userId) {
      setLoading(false)
      Alert.alert('Signup issue', 'Account was created, but no user ID was returned.')
      return
    }

    let avatarUrl: string | null = null

    if (avatarUri) {
      avatarUrl = await uploadAvatar(userId)

      if (avatarUrl) {
        await supabase.auth.updateUser({
          data: {
            username: cleanUsername,
            avatar_url: avatarUrl,
          },
        })
      }
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      avatar_url: avatarUrl,
    })

    setLoading(false)

    if (profileError) {
      if (isDuplicateUsernameError(profileError.message)) {
        Alert.alert('Username taken', 'That username is already in use. Please choose another one.')
      } else {
        Alert.alert('Profile setup error', profileError.message)
      }
      return
    }

    Alert.alert('Success', 'Account created.')
    router.replace('/')
  }

  async function getEmailForLogin(input: string) {
    const cleanInput = input.trim().toLowerCase()

    if (cleanInput.includes('@')) {
      return cleanInput
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', input.trim())
      .maybeSingle()

    if (error) {
      Alert.alert('Username login error', error.message)
      return null
    }

    if (!data?.email) {
      Alert.alert('Account not found', 'No account was found with that username.')
      return null
    }

    return data.email
  }

  async function signIn() {
    if (loading) return

    if (!loginInput.trim()) {
      Alert.alert('Missing login', 'Please enter your username or email.')
      return
    }

    if (!password) {
      Alert.alert('Missing password', 'Please enter your password.')
      return
    }

    setLoading(true)

    const loginEmail = await getEmailForLogin(loginInput)

    if (!loginEmail) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    })

    setLoading(false)

    if (error) {
      Alert.alert('Login error', error.message)
    } else if (!data.session) {
      Alert.alert('Login issue', 'No session returned')
    } else {
      router.replace('/')
    }
  }

  function resetFields() {
    setLoginInput('')
    setEmail('')
    setPassword('')
    setUsername('')
    setAvatarUri(null)
  }

  function goToMode(nextMode: AuthMode) {
    resetFields()
    setMode(nextMode)
  }

  return (
    <ScreenWrapper backgroundColor="#f7faf9">
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.logo}>Tweeter</Text>
            <Text style={styles.subtitle}>Bird sightings, profiles, and community posts.</Text>

            {mode === 'options' && (
              <View style={styles.optionContainer}>
                <PrimaryButton title="Log In" onPress={() => goToMode('login')} />
                <SecondaryButton title="Create Account" onPress={() => goToMode('signup')} />
              </View>
            )}

            {mode === 'login' && (
              <View style={styles.form}>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.helperText}>Log in with your username or email.</Text>

                <TextInput
                  placeholder="Username or email"
                  placeholderTextColor="#7a8a83"
                  value={loginInput}
                  onChangeText={setLoginInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={styles.input}
                />

                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#7a8a83"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                />

                <PrimaryButton title="Log In" onPress={signIn} loading={loading} />

                <Pressable onPress={() => goToMode('signup')} style={styles.textButton}>
                  <Text style={styles.textButtonText}>Need an account? Sign up</Text>
                </Pressable>

                <Pressable onPress={() => goToMode('options')} style={styles.backButton}>
                  <Text style={styles.backButtonText}>Back</Text>
                </Pressable>
              </View>
            )}

            {mode === 'signup' && (
              <View style={styles.form}>
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.helperText}>Set up your Tweeter profile.</Text>

                <Pressable onPress={pickAvatar} style={styles.avatarButton}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarLetter}>
                        {username.trim().charAt(0).toUpperCase() || 'T'}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.avatarText}>Add Profile Picture Optional</Text>
                </Pressable>

                <TextInput
                  placeholder="Username"
                  placeholderTextColor="#7a8a83"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />

                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#7a8a83"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={styles.input}
                />

                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#7a8a83"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                />

                <PrimaryButton title="Create Account" onPress={signUp} loading={loading} />

                <Pressable onPress={() => goToMode('login')} style={styles.textButton}>
                  <Text style={styles.textButtonText}>Already have an account? Log in</Text>
                </Pressable>

                <Pressable onPress={() => goToMode('options')} style={styles.backButton}>
                  <Text style={styles.backButtonText}>Back</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}

function PrimaryButton({
  title,
  onPress,
  loading = false,
}: {
  title: string
  onPress: () => void
  loading?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.buttonPressed,
        loading && styles.buttonDisabled,
      ]}
    >
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>{title}</Text>}
    </Pressable>
  )
}

function SecondaryButton({
  title,
  onPress,
}: {
  title: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        pressed && styles.secondaryButtonPressed,
      ]}
    >
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1f5136',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#52635b',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  optionContainer: {
    gap: 14,
  },
  form: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#17251d',
    marginBottom: 2,
  },
  helperText: {
    fontSize: 14,
    color: '#66756e',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#d7e2dc',
    backgroundColor: '#f8fbf9',
    color: '#17251d',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#eef7f1',
    borderWidth: 1.5,
    borderColor: '#2f855a',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#2f855a',
    fontWeight: '800',
    fontSize: 16,
  },
  buttonPressed: {
    backgroundColor: '#236844',
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonPressed: {
    backgroundColor: '#dcefe4',
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  textButtonText: {
    color: '#2f855a',
    fontWeight: '700',
    fontSize: 15,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#66756e',
    fontWeight: '600',
  },
  avatarButton: {
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 10,
  },
  avatarFallback: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#2f855a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  avatarText: {
    color: '#2f855a',
    fontWeight: '800',
  },
})