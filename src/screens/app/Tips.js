import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function Tips({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const [modalidades, setModalidades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModalidades() {
      try {
        const { data, error } = await supabase.from('modalidades').select('*').order('nome');
        if (error) throw error;
        setModalidades(data || []);
      } catch (error) {
        console.log('Erro ao buscar modalidades:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchModalidades();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerLoading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Treinos e Guias</Text>
        <Text style={[styles.subtitle, { color: colors.sub }]}>Escolha o esporte que deseja aprender</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {modalidades.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('GuiasList', { modalidade: item })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.divider }]}>
              <MaterialCommunityIcons name={item.icone || 'dumbbell'} size={32} color={colors.accent} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.nome}</Text>
              <Text style={[styles.cardSub, { color: colors.sub }]} numberOfLines={1}>
                Ver guias e tutoriais
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.sub} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 4 },
  content: { padding: 20, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  iconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 13 },
});