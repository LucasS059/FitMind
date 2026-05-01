import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  ActivityIndicator, TouchableOpacity, 
  ScrollView, StatusBar, useColorScheme 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function Home() {
  const deviceTheme = useColorScheme();
  const [isDark, setIsDark] = useState(deviceTheme === 'dark');
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = {
    bg: isDark ? '#0F172A' : '#F1F5F9',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#1E293B',
    subtext: isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    border: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
  };

  async function fetchModalidades() {
    try {
      const { data, error } = await supabase
        .from('modalidades') 
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setLista(data || []);
    } catch (error) {
      console.error('Erro:', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchModalidades();
  }, []);

  // Card de Modalidade em Carrossel
  const renderSportItem = ({ item }) => (
    <TouchableOpacity style={[styles.sportItem, { backgroundColor: theme.card }]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={item.icone?.toLowerCase() || 'run'} size={24} color={theme.accent} />
      </View>
      <Text style={[styles.sportLabel, { color: theme.text }]}>{item.nome}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* Header Minimalista */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: theme.subtext }]}>Bora treinar,</Text>
              <Text style={[styles.userName, { color: theme.text }]}>Lucas Barboza</Text>
            </View>
            <TouchableOpacity onPress={() => setIsDark(!isDark)} style={[styles.themeBtn, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name={isDark ? 'weather-sunny' : 'weather-night'} size={22} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {/* Widgets de Performance (Incentivo ao seu PI) */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name="fire" size={20} color="#EF4444" />
              <Text style={[styles.statValue, { color: theme.text }]}>450</Text>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>kcal</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name="walk" size={20} color={theme.accent} />
              <Text style={[styles.statValue, { color: theme.text }]}>8.4k</Text>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>passos</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#3B82F6" />
              <Text style={[styles.statValue, { color: theme.text }]}>32m</Text>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>atividade</Text>
            </View>
          </View>

          {/* Seção Horizontal de Modalidades (Dados do Supabase) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Escolha um esporte</Text>
            {loading ? (
              <ActivityIndicator color={theme.accent} />
            ) : (
              <FlatList
                horizontal
                data={lista}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSportItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            )}
          </View>

          {/* Card de "Próximo Passo" - Localização (Core do Projeto) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Lugares perto de você</Text>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.accent }]}>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Quadra de Tênis - Mauá</Text>
                <Text style={styles.actionSub}>A 1.2km de distância</Text>
              </View>
              <MaterialCommunityIcons name="map-marker-distance" size={32} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, marginTop: 12, borderWidth: 1, borderColor: theme.border }]}>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: theme.text }]}>Parque Celso Daniel</Text>
                <Text style={[styles.actionSub, { color: theme.subtext }]}>Ideal para Ciclismo e Corrida</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={28} color={theme.subtext} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  greeting: { fontSize: 14, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800' },
  themeBtn: { padding: 10, borderRadius: 12, elevation: 1 },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 30 },
  statCard: { width: '30%', padding: 15, borderRadius: 20, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 5 },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 24, marginBottom: 15 },
  horizontalList: { paddingHorizontal: 24 },
  
  sportItem: { alignItems: 'center', marginRight: 15, padding: 15, borderRadius: 20, width: 90, elevation: 2 },
  iconCircle: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 50, marginBottom: 8 },
  sportLabel: { fontSize: 12, fontWeight: '700' },

  actionCard: { flexDirection: 'row', marginHorizontal: 24, padding: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between', elevation: 3 },
  actionInfo: { flex: 1 },
  actionTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  actionSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }
});