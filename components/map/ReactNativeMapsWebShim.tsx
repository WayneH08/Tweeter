import { View } from 'react-native'

export default function MapView(props: any) {
  return <View {...props} />
}

export function Marker() {
  return null
}

export function Callout(props: any) {
  return <View {...props} />
}

export type Region = {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}