import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

// Importando o novo componente ajustado
import FitMindAI from './fitmind_ai';

export default function Home({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const [nome, setNome] = useState('');
  const [stats, setStats] = useState({ qtd: 0, kcal: 0, km: 0 });
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [creditosIA, setCreditosIA] = useState(5);

  const C = {
    bg: isDark ? '#0B1120' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    sub: isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    aiPurple: isDark ? '#6366F1' : '#4F46E5',
    border: isDark ? '#1E293B' : '#E2E8F0',
    divider: isDark ? '#334155' : '#F1F5F9'
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome, ia_creditos')
        .eq('id', user.id)
        .single();
        
      if (perfil) {
        setNome(perfil.nome ? perfil.nome.split(' ')[0] : 'Atleta');
        setCreditosIA(perfil.ia_creditos !== null ? perfil.ia_creditos : 5);
      }

      const { data: treinos } = await supabase
        .from('treinos')
        .select('*')
        .eq('perfil_id', user.id)
        .order('data_treino', { ascending: false });

      if (treinos) {
        setHistorico(treinos.slice(0, 3));
        const acumulado = treinos.reduce((acc, t) => ({
          qtd: acc.qtd + 1, 
          kcal: acc.kcal + (t.calorias || 0), 
          km: acc.km + parseFloat(t.distancia_km || 0)
        }), { qtd: 0, kcal: 0, km: 0 });
        
        setStats({ qtd: acumulado.qtd, kcal: acumulado.kcal, km: acumulado.km.toFixed(1) });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="small" color={C.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: C.sub }]}>BEM-VINDO DE VOLTA</Text>
            <Text style={[styles.name, { color: C.text }]}>{nome}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={[styles.profileButton, { borderColor: C.border, backgroundColor: C.card }]}>
            <MaterialCommunityIcons name="account" size={22} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* Painel Unificado de Estatísticas */}
        <View style={[styles.mainCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: C.text }]}>Visão Geral</Text>
            <Text style={[styles.cardSubtitle, { color: C.sub }]}>Métricas Acumuladas</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: C.divider }]} />
          <View style={styles.statsGrid}>
            <View style={styles.gridItem}>
              <Text style={[styles.gridVal, { color: C.text }]}>{stats.qtd}</Text>
              <Text style={[styles.gridLabel, { color: C.sub }]}>Atividades</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.gridVal, { color: C.text }]}>{stats.km}<Text style={styles.unit}> km</Text></Text>
              <Text style={[styles.gridLabel, { color: C.sub }]}>Distância</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.gridVal, { color: C.text }]}>{stats.kcal}</Text>
              <Text style={[styles.gridLabel, { color: C.sub }]}>Calorias</Text>
            </View>
          </View>
        </View>

        {/* Ação de Iniciar Exercício */}
        <TouchableOpacity style={[styles.recordButton, { backgroundColor: C.accent }]} onPress={() => navigation.navigate('Tracking')} activeOpacity={0.9}>
          <MaterialCommunityIcons name="record-circle" size={20} color="#FFF" />
          <Text style={styles.recordButtonText}>Iniciar Novo Treino</Text>
        </TouchableOpacity>

        {/* Card Premium de Integração com o FitMind AI */}
        <TouchableOpacity style={[styles.aiCard, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => setAiModalVisible(true)} activeOpacity={0.85}>
          <View style={styles.aiCardHeader}>
            <View style={[styles.aiIconBadge, { backgroundColor: isDark ? '#252F4A' : '#EEF2FF' }]}>
              <MaterialCommunityIcons name="brain" size={20} color={C.aiPurple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiCardTitle, { color: C.text }]}>Análise do FitMind AI</Text>
              <Text style={[styles.aiCardDesc, { color: C.sub }]}>Pergunte sobre sua evolução ou metas</Text>
            </View>
            <View style={[styles.creditTag, { backgroundColor: creditosIA > 0 ? '#E6F4EA' : '#FCE8E6' }]}>
              <Text style={[styles.creditTagText, { color: creditosIA > 0 ? '#137333' : '#C5221F' }]}>
                {creditosIA} disp.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Histórico Recente */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Últimas Atividades</Text>
        </View>
        
        {historico.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <MaterialCommunityIcons name="run" size={32} color={C.sub} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyText, { color: C.sub }]}>Nenhum registro encontrado de treinos.</Text>
          </View>
        ) : (
          historico.map((treino) => (
            <TouchableOpacity key={treino.id} style={[styles.activityCard, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.navigate('Details', { treino })} activeOpacity={0.8}>
              <View style={[styles.activityIconBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <MaterialCommunityIcons name={treino.modalidade?.toLowerCase() === 'ciclismo' ? "bike" : "run"} size={20} color={C.text} />
              </View>
              <View style={styles.activityMeta}>
                <Text style={[styles.activityTitle, { color: C.text }]}>{treino.modalidade || 'Atividade'}</Text>
                <Text style={[styles.activityDate, { color: C.sub }]}>{treino.data_treino || 'Hoje'}</Text>
              </View>
              <View style={styles.activityValues}>
                <Text style={[styles.activityDataText, { color: C.text }]}>{treino.distancia_km} km</Text>
                <Text style={[styles.activitySubDataText, { color: C.sub }]}>{treino.calorias} kcal</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={C.sub} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Renderizando o Modal Isolado */}
      <FitMindAI 
        visible={aiModalVisible} 
        onClose={() => setAiModalVisible(false)} 
        nome={nome}
        stats={stats}
        historico={historico}
        creditosIA={creditosIA}
        onUpdateCreditos={(novosCreditos) => setCreditosIA(novosCreditos)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  name: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  profileButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  mainCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  cardHeaderRow: { marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 4 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  gridItem: { flex: 1, alignItems: 'center' },
  gridVal: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  unit: { fontSize: 13, fontWeight: '500' },
  gridLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  recordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 14, gap: 8, marginBottom: 20, elevation: 1 },
  recordButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  aiCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 28, shadowColor: '#000', shadowOpacity: 0.01, shadowRadius: 8, elevation: 1 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  aiIconBadge: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  aiCardTitle: { fontSize: 15, fontWeight: '700' },
  aiCardDesc: { fontSize: 12, marginTop: 1 },
  creditTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  creditTagText: { fontSize: 11, fontWeight: '700' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  emptyCard: { padding: 30, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, fontWeight: '500' },
  activityCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1 },
  activityIconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  activityMeta: { flex: 1, marginLeft: 14 },
  activityTitle: { fontSize: 15, fontWeight: '700' },
  activityDate: { fontSize: 12, marginTop: 2 },
  activityValues: { alignItems: 'flex-end' },
  activityDataText: { fontSize: 15, fontWeight: '700' },
  activitySubDataText: { fontSize: 12, marginTop: 1 }
});