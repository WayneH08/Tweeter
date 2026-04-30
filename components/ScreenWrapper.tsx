import { ReactNode } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

type ScreenWrapperProps = {
  children: ReactNode
  backgroundColor?: string
}

export default function ScreenWrapper({
  children,
  backgroundColor = '#f3f4f6',
}: ScreenWrapperProps) {
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{
        flex: 1,
        backgroundColor,
      }}
    >
      {children}
    </SafeAreaView>
  )
}