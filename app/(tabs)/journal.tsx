import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import ScreenWrapper from '@/components/ScreenWrapper'
import { supabase } from '@/lib/supabase/supabase'
import { useTheme } from '@/lib/theme/ThemeContext'

type JournalEntry = {
  id: string
  user_id: string
  bird_name: string
  location_name: string | null
  notes: string | null
  is_public: boolean
  created_at: string
}

export default function JournalScreen() {
  const { theme } = useTheme()

  const colors = useMemo(() => {
    const isDark = theme.name === 'dark' || theme.name === 'goingGreen'

    return {
      background: theme.colors.background,
      card: theme.colors.card,
      cardSoft: theme.colors.cardAlt,
      text: theme.colors.text,
      mutedText: theme.colors.mutedText,
      border: theme.colors.border,
      primary: theme.colors.primary,
      primaryText: theme.colors.primaryText,
      primaryDark: isDark ? theme.colors.cardAlt : '#246236',
      danger: theme.colors.danger,
      input: theme.colors.inputBackground,
      placeholder: theme.colors.mutedText,
      overlay: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.45)',
    }
  }, [theme])

  const styles = useMemo(() => createStyles(colors), [colors])

  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  const [birdName, setBirdName] = useState('')
  const [locationName, setLocationName] = useState('')
  const [notes, setNotes] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    loadJournalEntries()
  }, [])

  async function loadJournalEntries() {
    setLoading(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setLoading(false)
      Alert.alert('Not signed in', 'Please sign in to view your bird journal.')
      return
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setEntries(data || [])
    }

    setLoading(false)
  }

  function resetForm() {
    setBirdName('')
    setLocationName('')
    setNotes('')
    setIsPublic(false)
  }

  async function saveJournalEntry() {
    if (!birdName.trim()) {
      Alert.alert('Missing bird name', 'Please enter the bird name before saving.')
      return
    }

    setSaving(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setSaving(false)
      Alert.alert('Not signed in', 'Please sign in before adding journal entries.')
      return
    }

    const { error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      bird_name: birdName.trim(),
      location_name: locationName.trim() || null,
      notes: notes.trim() || null,
      is_public: isPublic,
    })

    if (error) {
      Alert.alert('Error', error.message)
      setSaving(false)
      return
    }

    resetForm()
    setModalVisible(false)
    setSaving(false)
    loadJournalEntries()
  }

  async function deleteJournalEntry(id: string) {
    Alert.alert(
      'Delete entry?',
      'This journal entry will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('journal_entries')
              .delete()
              .eq('id', id)

            if (error) {
              Alert.alert('Error', error.message)
              return
            }

            setEntries((currentEntries) =>
              currentEntries.filter((entry) => entry.id !== id)
            )
          },
        },
      ]
    )
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function closeModal() {
    resetForm()
    setModalVisible(false)
  }

  function renderEntry({ item }: { item: JournalEntry }) {
    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryIcon}>
            <Ionicons name="leaf" size={22} color={colors.primary} />
          </View>

          <View style={styles.entryHeaderText}>
            <Text style={styles.entryTitle}>{item.bird_name}</Text>
            <Text style={styles.entryDate}>{formatDate(item.created_at)}</Text>
          </View>

          <Pressable
            onPress={() => deleteJournalEntry(item.id)}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>

        {item.location_name ? (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.mutedText} />
            <Text style={styles.detailText}>{item.location_name}</Text>
          </View>
        ) : null}

        {item.notes ? (
          <Text style={styles.notes}>{item.notes}</Text>
        ) : (
          <Text style={styles.emptyNotes}>No notes added.</Text>
        )}

        <View style={styles.visibilityPill}>
          <Ionicons
            name={item.is_public ? 'globe-outline' : 'lock-closed-outline'}
            size={14}
            color={colors.primary}
          />
          <Text style={styles.visibilityText}>
            {item.is_public ? 'Public entry' : 'Private entry'}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTextBox}>
            <Text style={styles.title}>Bird Journal</Text>
            <Text style={styles.subtitle}>
              Keep track of birds you’ve seen, notes, and personal sightings.
            </Text>
          </View>

          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <Ionicons name="add" size={26} color={colors.primaryText} />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="book-outline" size={24} color={colors.primary} />
          </View>

          <View>
            <Text style={styles.summaryNumber}>{entries.length}</Text>
            <Text style={styles.summaryLabel}>
              {entries.length === 1 ? 'journal entry' : 'journal entries'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading journal...</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            contentContainerStyle={
              entries.length === 0
                ? styles.emptyListContainer
                : styles.listContainer
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="journal-outline" size={38} color={colors.primary} />
                </View>

                <Text style={styles.emptyTitle}>No journal entries yet</Text>

                <Text style={styles.emptyText}>
                  Add your first bird journal entry to start building your personal log.
                </Text>

                <Pressable
                  onPress={() => setModalVisible(true)}
                  style={({ pressed }) => [
                    styles.emptyAddButton,
                    pressed && styles.addButtonPressed,
                  ]}
                >
                  <Ionicons name="add" size={20} color={colors.primaryText} />
                  <Text style={styles.emptyAddButtonText}>Add Entry</Text>
                </Pressable>
              </View>
            }
          />
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>New Journal Entry</Text>
                  <Text style={styles.modalSubtitle}>
                    Save a bird sighting to your personal log.
                  </Text>
                </View>

                <Pressable
                  onPress={closeModal}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Bird Name</Text>
                <TextInput
                  value={birdName}
                  onChangeText={setBirdName}
                  placeholder="Example: Northern Cardinal"
                  placeholderTextColor={colors.placeholder}
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="Example: Denton, TX"
                  placeholderTextColor={colors.placeholder}
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="What did you notice?"
                  placeholderTextColor={colors.placeholder}
                  style={[styles.input, styles.notesInput]}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchTextBox}>
                  <Text style={styles.switchTitle}>Make public</Text>
                  <Text style={styles.switchSubtitle}>
                    You can use this later to share selected journal entries.
                  </Text>
                </View>

                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  thumbColor={isPublic ? colors.primary : colors.card}
                  trackColor={{
                    false: colors.border,
                    true: colors.cardSoft,
                  }}
                />
              </View>

              <Pressable
                onPress={saveJournalEntry}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.addButtonPressed,
                  saving && styles.disabledButton,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.primaryText} />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color={colors.primaryText} />
                    <Text style={styles.saveButtonText}>Save Entry</Text>
                  </>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

function createStyles(colors: {
  background: string
  card: string
  cardSoft: string
  text: string
  mutedText: string
  border: string
  primary: string
  primaryText: string
  primaryDark: string
  danger: string
  input: string
  placeholder: string
  overlay: string
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 18,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
      marginBottom: 18,
    },
    headerTextBox: {
      flex: 1,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 21,
      color: colors.mutedText,
      maxWidth: 290,
    },
    addButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    addButtonPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.97 }],
    },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    summaryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryNumber: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.mutedText,
      marginTop: 1,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.background,
    },
    loadingText: {
      color: colors.mutedText,
      fontSize: 15,
    },
    listContainer: {
      paddingBottom: 30,
      gap: 14,
    },
    emptyListContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: 80,
    },
    entryCard: {
      backgroundColor: colors.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    entryIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    entryHeaderText: {
      flex: 1,
    },
    entryTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    entryDate: {
      fontSize: 13,
      color: colors.mutedText,
      marginTop: 2,
    },
    deleteButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardSoft,
    },
    pressed: {
      opacity: 0.7,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    detailText: {
      fontSize: 14,
      color: colors.mutedText,
    },
    notes: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
      marginBottom: 14,
    },
    emptyNotes: {
      fontSize: 14,
      fontStyle: 'italic',
      color: colors.mutedText,
      marginBottom: 14,
    },
    visibilityPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.cardSoft,
    },
    visibilityText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    emptyIcon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.mutedText,
      textAlign: 'center',
      marginBottom: 18,
    },
    emptyAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 999,
    },
    emptyAddButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '800',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    keyboardView: {
      width: '100%',
    },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
      gap: 12,
    },
    modalHeaderText: {
      flex: 1,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.mutedText,
      maxWidth: 280,
      lineHeight: 20,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    formGroup: {
      marginBottom: 14,
    },
    label: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 7,
    },
    input: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    },
    notesInput: {
      minHeight: 110,
      maxHeight: 150,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      backgroundColor: colors.cardSoft,
      borderRadius: 18,
      padding: 14,
      marginTop: 2,
      marginBottom: 18,
    },
    switchTextBox: {
      flex: 1,
    },
    switchTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 3,
    },
    switchSubtitle: {
      fontSize: 13,
      color: colors.mutedText,
      lineHeight: 18,
    },
    saveButton: {
      height: 52,
      borderRadius: 18,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    disabledButton: {
      backgroundColor: colors.primaryDark,
      opacity: 0.8,
    },
    saveButtonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '800',
    },
  })
}