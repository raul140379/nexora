import { View, Text, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nexora</Text>
      <Text style={styles.sub}>Sistema de Ventas</Text>
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e40af' },
  title: { color: '#fff', fontSize: 36, fontWeight: '800' },
  sub: { color: '#93c5fd', fontSize: 16, marginTop: 8 },
})
