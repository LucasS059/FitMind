import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Explorar() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📍 Próximo Passo:</Text>
      <Text style={styles.sub}>Aqui vamos renderizar o Mapa com os locais de {`\n`} Futebol, Tênis e Basquete próximos a você.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { color: '#10B981', fontSize: 24, fontWeight: 'bold' },
  sub: { color: '#94A3B8', textAlign: 'center', marginTop: 10, fontSize: 16 }
});