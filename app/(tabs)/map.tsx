import { useEffect, useState } from 'react'
import { View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { supabase } from '@/lib/supabase/supabase'
import ScreenWrapper from '@/components/ScreenWrapper'

export default function MapScreen() {
  const [sightings, setSightings] = useState<any[]>([])

  async function loadSightings() {
    const { data } = await supabase.from('sightings').select('*')
    if (data) setSightings(data)
  }

  useEffect(() => {
    loadSightings()
  }, [])

  return (
    <ScreenWrapper>
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 33.2148,
            longitude: -97.1331,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {sightings.map((s) => (
            <Marker
              key={s.id}
              coordinate={{
                latitude: s.latitude,
                longitude: s.longitude,
              }}
              title={s.bird_name}
              description={s.description}
            />
          ))}
        </MapView>
      </View>
    </ScreenWrapper>
  )
}