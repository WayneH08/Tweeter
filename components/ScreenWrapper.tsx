import { ReactNode } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/lib/theme/ThemeContext'

type ScreenWrapperProps = {
  children: ReactNode
  backgroundColor?: string
}

export default function ScreenWrapper({
  children,
  backgroundColor,
}: ScreenWrapperProps) {
  const { theme } = useTheme()

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{
        flex: 1,
        backgroundColor: backgroundColor || theme.colors.background,
      }}
    >
      {children}
    </SafeAreaView>
  )
}