import { useEffect, useState } from 'react'
import { Tabs, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Image, Pressable, Text, View } from 'react-native'
import { supabase } from '@/lib/supabase/supabase'

function HeaderProfileButton() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('T')

  async function loadUser() {
    const { data } = await supabase.auth.getUser()
    const user = data.user

    setAvatarUrl(user?.user_metadata?.avatar_url || null)
    setUsername(user?.user_metadata?.username || 'T')
  }

  useEffect(() => {
    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <Pressable
      onPress={() => router.push('/profile')}
      style={{ marginRight: 16 }}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#d1d5db',
          }}
        />
      ) : (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#2f855a',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            {username.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2f855a',
        tabBarInactiveTintColor: '#777',
        headerShown: false,
        headerRight: () => <HeaderProfileButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          title: 'Identify',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="database"
        options={{
          title: 'Birds',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}