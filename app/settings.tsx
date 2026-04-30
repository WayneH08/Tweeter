import { useEffect, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase/supabase'
import ScreenWrapper from '@/components/ScreenWrapper'
import { useTheme } from '@/lib/theme/ThemeContext'
import { ThemeName, themes } from '@/lib/theme/theme'

type SettingsData = {
  username: string
  email: string
  createdAt: string
}

export default function SettingsScreen() {
  const { theme, themeName, setThemeName } = useTheme()

  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [themeModalVisible, setThemeModalVisible] = useState(false)

  const styles = createStyles(theme.colors)

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

  async function handleSelectTheme(selectedTheme: ThemeName) {
    await setThemeName(selectedTheme)
    setThemeModalVisible(false)
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
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>

          <Text style={styles.headerTitle}>Settings</Text>

          <View style={styles.iconButtonPlaceholder} />
        </View>

        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={28} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>Account Settings</Text>
          <Text style={styles.subtitle}>
            Manage login details, account information, and app preferences for your Tweeter
            account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <Pressable
            onPress={() => setThemeModalVisible(true)}
            style={({ pressed }) => [styles.infoCard, pressed && styles.pressedCard]}
          >
            <View style={styles.infoIcon}>
              <Ionicons name="color-palette-outline" size={22} color={theme.colors.primary} />
            </View>

            <View style={styles.infoTextWrap}>
              <Text style={styles.label}>Themes</Text>
              <Text style={styles.value}>{theme.label}</Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color={theme.colors.mutedText} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.primary} />
            </View>

            <View style={styles.infoTextWrap}>
              <Text style={styles.label}>Login Status</Text>
              <Text style={styles.value}>Logged in</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
            </View>

            <View style={styles.infoTextWrap}>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.value}>{settings?.username || 'Loading...'}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail-outline" size={22} color={theme.colors.primary} />
            </View>

            <View style={styles.infoTextWrap}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{settings?.email || 'Loading...'}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={22} color={theme.colors.primary} />
            </View>

            <View style={styles.infoTextWrap}>
              <Text style={styles.label}>Account Created</Text>
              <Text style={styles.value}>{settings?.createdAt || 'Loading...'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>

          <Pressable onPress={logout} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressedCard]}>
            <Ionicons name="log-out-outline" size={21} color="white" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={themeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Theme</Text>

              <Pressable onPress={() => setThemeModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={26} color={theme.colors.text} />
              </Pressable>
            </View>

            {(Object.keys(themes) as ThemeName[]).map((option) => {
              const optionTheme = themes[option]
              const selected = option === themeName

              return (
                <Pressable
                  key={option}
                  onPress={() => handleSelectTheme(option)}
                  style={({ pressed }) => [
                    styles.themeOption,
                    selected && styles.selectedThemeOption,
                    pressed && styles.pressedCard,
                  ]}
                >
                  <View style={styles.themePreviewWrap}>
                    <View
                      style={[
                        styles.themePreviewCircle,
                        {
                          backgroundColor: optionTheme.colors.background,
                          borderColor: optionTheme.colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.themePreviewDot,
                          {
                            backgroundColor: optionTheme.colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.themeTextWrap}>
                    <Text style={styles.themeOptionTitle}>{optionTheme.label}</Text>

                    <Text style={styles.themeOptionSubtitle}>
                      {option === 'light' && 'Clean default light mode'}
                      {option === 'dark' && 'Simple black dark mode'}
                      {option === 'ecoFlight' && 'Soft light green mode'}
                      {option === 'goingGreen' && 'Deep green dark mode'}
                    </Text>
                  </View>

                  {selected ? (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={24} color={theme.colors.mutedText} />
                  )}
                </Pressable>
              )
            })}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

function createStyles(colors: {
  background: string
  card: string
  cardAlt: string
  text: string
  mutedText: string
  border: string
  primary: string
  primaryText: string
  inputBackground: string
  tabBar: string
  tabBarActive: string
  tabBarInactive: string
  danger: string
}) {
  return {
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },
    centerScreen: {
      flex: 1,
      backgroundColor: colors.background,
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
      backgroundColor: colors.card,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconButtonPlaceholder: {
      width: 42,
      height: 42,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: 'bold' as const,
    },
    headerCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 22,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    headerIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.cardAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 12,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: 'bold' as const,
      marginBottom: 6,
      textAlign: 'center' as const,
    },
    subtitle: {
      color: colors.mutedText,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center' as const,
    },
    section: {
      marginBottom: 22,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: 'bold' as const,
      marginBottom: 12,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    pressedCard: {
      opacity: 0.75,
      transform: [{ scale: 0.99 }],
    },
    infoIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.cardAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    infoTextWrap: {
      flex: 1,
    },
    label: {
      color: colors.mutedText,
      fontSize: 13,
      marginBottom: 4,
      fontWeight: '600' as const,
    },
    value: {
      color: colors.text,
      fontSize: 15,
      fontWeight: 'bold' as const,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      paddingHorizontal: 26,
      borderRadius: 14,
      alignItems: 'center' as const,
    },
    primaryButtonText: {
      color: colors.primaryText,
      fontWeight: 'bold' as const,
      fontSize: 16,
    },
    logoutButton: {
      width: '100%' as const,
      backgroundColor: colors.danger,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end' as const,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      paddingBottom: 34,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 18,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: 'bold' as const,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    themeOption: {
      backgroundColor: colors.cardAlt,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    selectedThemeOption: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    themePreviewWrap: {
      width: 42,
      height: 42,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    themePreviewCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    themePreviewDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    themeTextWrap: {
      flex: 1,
    },
    themeOptionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: 'bold' as const,
    },
    themeOptionSubtitle: {
      color: colors.mutedText,
      fontSize: 13,
      marginTop: 3,
    },
  }
}