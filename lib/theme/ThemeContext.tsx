import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { AppTheme, ThemeName, themes } from './theme'

const THEME_STORAGE_KEY = 'tweeter-theme'

type ThemeContextValue = {
  theme: AppTheme
  themeName: ThemeName
  setThemeName: (themeName: ThemeName) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>('light')

  useEffect(() => {
    async function loadSavedTheme() {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY)

      if (
        savedTheme === 'light' ||
        savedTheme === 'dark' ||
        savedTheme === 'ecoFlight' ||
        savedTheme === 'goingGreen'
      ) {
        setThemeNameState(savedTheme)
      }
    }

    loadSavedTheme()
  }, [])

  async function setThemeName(newThemeName: ThemeName) {
    setThemeNameState(newThemeName)
    await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeName)
  }

  const value = useMemo(
    () => ({
      theme: themes[themeName],
      themeName,
      setThemeName,
    }),
    [themeName]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}