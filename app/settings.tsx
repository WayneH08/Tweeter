import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase/supabase'
import ScreenWrapper from '@/components/ScreenWrapper'

type SettingsData = {
  username: string
  email: string
  createdAt: string
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    loadSettings()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)

      if (session?.user) {
        loadSettings()
      } else {
        setSettings(null)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function loadSettings() {
    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) {
      setIsLoggedIn(false)
      setSettings(null)
      return
    }

    setIsLoggedIn(true)

    const fallbackUsername =
      user.user_metadata?.username ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Tweeter User'

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()

    setSettings({
      username: profileRow?.username || fallbackUsername,
      email: user.email || 'No email found',
      createdAt: user.created_at
        ? new Date(user.created_at).toLocaleDateString([], {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Unknown',
    })
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      Alert.alert('Logout error', error.message)
      return
    }

    setSettings(null)
    setIsLoggedIn(false)
    router.replace('/auth')
  }

  if (!isLoggedIn) {
    return (
      <ScreenWrapper>
        <View style={styles.centerScreen}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>You are not logged in.</Text>

          <Pressable onPress={() => router.push('/auth')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Go to Login</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>

          <Text style={styles.headerTitle}>Settings</Text>

          <View style={styles.iconButtonPlaceholder} />
        </View>

        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={28} color="#2f855a" />
          </View>

          <Text style={styles.title}>Account Settings</Text>
          <Text style={styles.subtitle}>
            Manage login details and account information for your Tweeter account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#2f855a" />
            </View>

            <View style={styles.infoTextWrap}>
              <Text style={styles.label}>Login Status</Text>
              <Text style={styles.value}>Logged in</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="person-outline" size={22} color="#2f855a" />
            </View>

            <View style={styles.infoTextWrap}>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.value}>{settings?.username || 'Loading...'}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail-outline" size={22} color="#2f855a" />
            </View>

            <View style={styles.infoTextWrap}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{settings?.email || 'Loading...'}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={22} color="#2f855a" />
            </View>

            <View style={styles.infoTextWrap}>
              <Text style={styles.label}>Account Created</Text>
              <Text style={styles.value}>{settings?.createdAt || 'Loading...'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>

          <Pressable onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={21} color="white" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenWrapper>
  )
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  topBar: {
    width: '100%' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 18,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'white',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ecfdf5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  title: {
    color: '#111827',
    fontSize: 26,
    fontWeight: 'bold' as const,
    marginBottom: 6,
    textAlign: 'center' as const,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ecfdf5',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  infoTextWrap: {
    flex: 1,
  },
  label: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  value: {
    color: '#111827',
    fontSize: 15,
    fontWeight: 'bold' as const,
  },
  primaryButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 15,
    paddingHorizontal: 26,
    borderRadius: 14,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  logoutButton: {
    width: '100%' as const,
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
}