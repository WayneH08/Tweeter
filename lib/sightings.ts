import { supabase } from '@/lib/supabase/supabase'

export type Sighting = {
  id: string
  user_id: string
  username: string | null
  bird_name: string
  description: string | null
  latitude: number
  longitude: number
  location_name: string | null
  photo_url: string | null
  created_at: string
}

export async function fetchSightings() {
  return await supabase
    .from('sightings')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function createSighting(data: {
  user_id: string
  username: string
  bird_name: string
  description: string
  latitude: number
  longitude: number
  location_name: string
  photo_url?: string | null
}) {
  return await supabase
    .from('sightings')
    .insert(data)
}

export async function deleteSighting(id: string) {
  return await supabase
    .from('sightings')
    .delete()
    .eq('id', id)
}