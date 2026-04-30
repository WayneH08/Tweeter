import { Link } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '@/lib/theme/ThemeContext'

export default function ModalScreen() {
  const { theme } = useTheme()
  const styles = createStyles(theme.colors)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This is a modal</Text>

      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Go to home screen</Text>
      </Link>
    </View>
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      textAlign: 'center',
    },
    link: {
      marginTop: 15,
      paddingVertical: 15,
    },
    linkText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '700',
    },
  })
}