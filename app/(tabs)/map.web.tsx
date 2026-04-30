import { StyleSheet, Text, View } from 'react-native'
import ScreenWrapper from '@/components/ScreenWrapper'
import { useTheme } from '@/lib/theme/ThemeContext'

export default function MapWebScreen() {
  const { theme } = useTheme()

  return (
    <ScreenWrapper backgroundColor={theme.colors.background}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Map is mobile-only for now
        </Text>

        <Text style={[styles.text, { color: theme.colors.mutedText }]}>
          The live map uses react-native-maps, which works on iOS and Android but
          does not run in the browser. Open Tweeter in Expo Go or an emulator to
          use the map.
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
    fontWeight: '800',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
})