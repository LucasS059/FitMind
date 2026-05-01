import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function Perfil() {
  return (
    <View style={styles.container}>
      <View style={styles.avatarPlaceholder} />
      <Text style={styles.name}>Lucas Silva</Text>
      <Text style={styles.level}>Nível: Iniciante no Tênis 🎾</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', paddingTop: 80 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1E293B', marginBottom: 20 },
  name: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  level: { color: '#10B981', marginTop: 10 }
});