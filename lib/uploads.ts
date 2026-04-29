import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { supabase } from '@/lib/supabase/supabase'

const BUCKET_NAME = 'bird-photos'

export async function uploadSightingPhoto(uri: string, userId: string) {
  const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg'
  const cleanExt = fileExt.includes('?') ? 'jpg' : fileExt

  const filePath = `${userId}/${Date.now()}.${cleanExt}`

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  })

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, decode(base64), {
      contentType: `image/${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`,
      upsert: false,
    })

  if (error) {
    throw error
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return data.publicUrl
}