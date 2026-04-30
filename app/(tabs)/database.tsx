import { View, Text, StyleSheet } from 'react-native';

export default function DatabaseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bird Database</Text>
      <Text style={styles.text}>
        This will become the searchable bird information area with names, photos, calls, regions, and fun facts.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f7faf7' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#1f3d2b' },
  text: { fontSize: 16, lineHeight: 24, color: '#444' },
});