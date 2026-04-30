export type ThemeName = 'light' | 'dark' | 'ecoFlight' | 'goingGreen'

export type AppTheme = {
  name: ThemeName
  label: string
  colors: {
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
  }
}

export const themes: Record<ThemeName, AppTheme> = {
  light: {
    name: 'light',
    label: 'Light',
    colors: {
      background: '#F8FAFC',
      card: '#FFFFFF',
      cardAlt: '#F1F5F9',
      text: '#0F172A',
      mutedText: '#64748B',
      border: '#E2E8F0',
      primary: '#16A34A',
      primaryText: '#FFFFFF',
      inputBackground: '#FFFFFF',
      tabBar: '#FFFFFF',
      tabBarActive: '#16A34A',
      tabBarInactive: '#94A3B8',
      danger: '#DC2626',
    },
  },

  dark: {
    name: 'dark',
    label: 'Dark',
    colors: {
      background: '#000000',
      card: '#111827',
      cardAlt: '#1F2937',
      text: '#F9FAFB',
      mutedText: '#9CA3AF',
      border: '#374151',
      primary: '#22C55E',
      primaryText: '#03140A',
      inputBackground: '#111827',
      tabBar: '#050505',
      tabBarActive: '#22C55E',
      tabBarInactive: '#6B7280',
      danger: '#F87171',
    },
  },

  ecoFlight: {
    name: 'ecoFlight',
    label: 'Eco Flight',
    colors: {
      background: '#F0FDF4',
      card: '#FFFFFF',
      cardAlt: '#DCFCE7',
      text: '#052E16',
      mutedText: '#3F6F4B',
      border: '#BBF7D0',
      primary: '#15803D',
      primaryText: '#FFFFFF',
      inputBackground: '#FFFFFF',
      tabBar: '#ECFDF5',
      tabBarActive: '#15803D',
      tabBarInactive: '#6B8F71',
      danger: '#B91C1C',
    },
  },

  goingGreen: {
    name: 'goingGreen',
    label: 'Going Green',
    colors: {
      background: '#03140A',
      card: '#052E16',
      cardAlt: '#064E3B',
      text: '#ECFDF5',
      mutedText: '#A7F3D0',
      border: '#166534',
      primary: '#86EFAC',
      primaryText: '#052E16',
      inputBackground: '#052E16',
      tabBar: '#021007',
      tabBarActive: '#86EFAC',
      tabBarInactive: '#6EE7B7',
      danger: '#FCA5A5',
    },
  },
}