import { View, Text, StyleSheet } from 'react-native'
import ScreenWrapper from '@/components/ScreenWrapper'
import { useTheme } from '@/lib/theme/ThemeContext'

export default function DatabaseScreen() {
  const { theme } = useTheme()
  const styles = createStyles(theme.colors)

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Bird Database</Text>

          <Text style={styles.text}>
            This will become the searchable bird information area with names, photos,
            calls, regions, and fun facts.
          </Text>
        </View>
      </View>
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
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      padding: 22,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 12,
      color: colors.text,
    },
    text: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.mutedText,
    },
  })
}