import { supabase } from '@/lib/supabase/supabase'

export type Sighting = {
  id: string
  user_id: string
  username: string | null
  avatar_url: string | null
  bird_name: string
  description: string | null
  latitude: number
  longitude: number
  location_name: string | null
  photo_url: string | null
  created_at: string
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
}

export async function fetchSightings() {
  return await supabase
    .from('sightings')
    .select(`
      *,
      profiles!sightings_user_id_profiles_fkey (
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
}

export async function createSighting(data: {
  user_id: string
  username?: string | null
  avatar_url?: string | null
  bird_name: string
  description: string
  latitude: number
  longitude: number
  location_name: string
  photo_url?: string | null
}) {
  return await supabase.from('sightings').insert(data)
}

export async function deleteSighting(id: string) {
  return await supabase.from('sightings').delete().eq('id', id)
}