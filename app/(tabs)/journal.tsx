import { View, Text, StyleSheet } from 'react-native'
import ScreenWrapper from '@/components/ScreenWrapper'

export default function JournalScreen() {
  return (
    <ScreenWrapper backgroundColor="#f7faf7">
      <View style={styles.container}>
        <Text style={styles.title}>Bird Journal</Text>
        <Text style={styles.text}>
          This will be the user’s personal bird log with private entries, notes, photos, and optional public sharing.
        </Text>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f3d2b',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
})