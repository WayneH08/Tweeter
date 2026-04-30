import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/lib/supabase/supabase'
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeContext'

function isLightColor(hexColor: string) {
  const hex = hexColor.replace('#', '')

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  return brightness > 155
}

function AppStack({ session }: { session: any }) {
  const { theme } = useTheme()

  const statusBarStyle = isLightColor(theme.colors.background) ? 'dark' : 'light'

  return (
    <>
      <StatusBar style={statusBarStyle} />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="settings" />
          </>
        ) : (
          <Stack.Screen name="auth" />
        )}
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppStack session={session} />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}