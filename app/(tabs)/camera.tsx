import { View, Text, StyleSheet } from 'react-native';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bird Identification</Text>
      <Text style={styles.text}>
        This will later use the camera or photo upload to identify bird species.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f7faf7' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#1f3d2b' },
  text: { fontSize: 16, lineHeight: 24, color: '#444' },
});