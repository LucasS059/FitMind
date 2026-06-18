import React, { useState, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

import FitMindAI from '../../components/FitMindAI';

export default function Home({ navigation }) {
  const { isDark, colors } = useContext(ThemeContext);

  const [nome, setNome] = useState('');
  const [stats, setStats] = useState({ qtd: 0, kcal: 0, km: 0 });
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [treinosNaSemana, setTreinosNaSemana] = useState(0);
  const [metaSemanal, setMetaSemanal] = useState(5);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [creditosIA, setCreditosIA] = useState(5);

  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'BOM DIA';
    if (hora >= 12 && hora < 18) return 'BOA TARDE';
    return 'BOA NOITE';
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome, ia_creditos, meta_semanal')
        .eq('id', user.id)
        .single();

      if (perfil) {
        setNome(perfil.nome ? perfil.nome.split(' ')[0] : 'Atleta');
        setCreditosIA(perfil.ia_creditos !== null ? perfil.ia_creditos : 5);
        if (perfil.meta_semanal) setMetaSemanal(perfil.meta_semanal);
      }

      const { data: treinos } = await supabase
        .from('treinos')
        .select(`
          *,
          modalidade:modalidades!treinos_modalidade_id_fkey(
            nome,
            icone
          )
        `)
        .eq('perfil_id', user.id)
        .order('data_treino', { ascending: false });

      if (treinos) {
        setHistorico(treinos.slice(0, 3));

        const acumulado = treinos.reduce((acc, t) => ({
          qtd: acc.qtd + 1,
          kcal: acc.kcal + (t.calorias || 0),
          km: acc.km + parseFloat(t.distancia_km || 0)
        }), { qtd: 0, kcal: 0, km: 0 });

        setStats({
          qtd: acumulado.qtd,
          kcal: acumulado.kcal,
          km: acumulado.km.toFixed(1)
        });

        const hoje = new Date();
        const limiteSemana = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
        const treinosRecentes = treinos.filter(t => new Date(t.data_treino) >= limiteSemana).length;
        setTreinosNaSemana(treinosRecentes);
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const progressoPorcentagem = Math.min((treinosNaSemana / metaSemanal) * 100, 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.sub }]}>{getSaudacao()}</Text>
            <Text style={[styles.name, { color: colors.text }]}>{nome}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={[styles.profileButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.goalHeader}>
            <Text style={[styles.goalTitle, { color: colors.text }]}>Consistência Semanal</Text>
            <Text style={[styles.goalCount, { color: colors.accent }]}>{treinosNaSemana} / {metaSemanal}</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.divider }]}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.accent, width: `${progressoPorcentagem}%` }]} />
          </View>
          <Text style={[styles.goalSub, { color: colors.sub }]}>
            {treinosNaSemana >= metaSemanal
              ? 'Meta atingida! Você está imparável.'
              : `Faltam ${metaSemanal - treinosNaSemana} treinos para bater a sua meta!`}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="fire" size={24} color="#F97316" style={styles.gridIcon} />
            <Text style={[styles.gridVal, { color: colors.text }]}>{stats.kcal}</Text>
            <Text style={[styles.gridLabel, { color: colors.sub }]}>Calorias</Text>
          </View>
          <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="map-marker-distance" size={24} color="#3B82F6" style={styles.gridIcon} />
            <Text style={[styles.gridVal, { color: colors.text }]}>{stats.km}<Text style={styles.unit}> km</Text></Text>
            <Text style={[styles.gridLabel, { color: colors.sub }]}>Distância</Text>
          </View>
          <View style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#EAB308" style={styles.gridIcon} />
            <Text style={[styles.gridVal, { color: colors.text }]}>{stats.qtd}</Text>
            <Text style={[styles.gridLabel, { color: colors.sub }]}>Treinos</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('Tracking')}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons name="play-circle" size={22} color="#FFF" />
          <Text style={styles.recordButtonText}>Gravar Treino</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setAiModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.aiCardHeader}>
            <View style={[styles.aiIconBadge, { backgroundColor: isDark ? '#252F4A' : '#EEF2FF' }]}>
              <MaterialCommunityIcons name="brain" size={22} color={colors.aiPurple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiCardTitle, { color: colors.text }]}>FitMind AI</Text>
              <Text style={[styles.aiCardDesc, { color: colors.sub }]}>Personal Trainer Inteligente</Text>
            </View>
            <View style={[styles.creditTag, { backgroundColor: creditosIA > 0 ? '#E6F4EA' : '#FCE8E6' }]}>
              <Text style={[styles.creditTagText, { color: creditosIA > 0 ? '#137333' : '#C5221F' }]}>
                {creditosIA} disp.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Histórico Recente</Text>
          {historico.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={[styles.seeAllText, { color: colors.accent }]}>Ver tudo</Text>
            </TouchableOpacity>
          )}
        </View>

        {historico.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="shoe-sneaker" size={40} color={colors.sub} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: colors.sub }]}>A sua jornada começa aqui.</Text>
            <Text style={[styles.emptySubText, { color: colors.sub }]}>Registe o seu primeiro treino hoje.</Text>
          </View>
        ) : (
          historico.map((treino) => {
            const nomeModalidade = treino.modalidade?.nome || 'Atividade';
            const iconeModalidade = treino.modalidade?.icone || 'run';

            return (
              <TouchableOpacity
                key={treino.id}
                style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('History', { treino: treino })}
                activeOpacity={0.8}
              >
                <View style={[styles.activityIconBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                  <MaterialCommunityIcons name={iconeModalidade} size={24} color={colors.text} />
                </View>
                <View style={styles.activityMeta}>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>{nomeModalidade}</Text>
                  <Text style={[styles.activityDate, { color: colors.sub }]}>
                    {new Date(treino.data_treino).toLocaleDateString('pt-PT')}
                  </Text>
                </View>
                <View style={styles.activityValues}>
                  <Text style={[styles.activityDataText, { color: colors.text }]}>{treino.distancia_km} km</Text>
                  <Text style={[styles.activitySubDataText, { color: colors.sub }]}>{treino.calorias} kcal</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

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
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  greeting: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  name: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  profileButton: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

  goalCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 20 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  goalTitle: { fontSize: 16, fontWeight: '800' },
  goalCount: { fontSize: 16, fontWeight: '800' },
  progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', borderRadius: 5 },
  goalSub: { fontSize: 13, fontWeight: '500' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  gridItem: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  gridIcon: { marginBottom: 8 },
  gridVal: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  unit: { fontSize: 13, fontWeight: '600' },
  gridLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  recordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, borderRadius: 18, gap: 10, marginBottom: 24, shadowColor: '#10B981', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  recordButtonText: { color: '#FFF', fontSize: 17, fontWeight: '800' },

  aiCard: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 30 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  aiIconBadge: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  aiCardTitle: { fontSize: 17, fontWeight: '800' },
  aiCardDesc: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  creditTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  creditTagText: { fontSize: 12, fontWeight: '800' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  seeAllText: { fontSize: 14, fontWeight: '700' },

  emptyCard: { padding: 40, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySubText: { fontSize: 14, fontWeight: '500' },

  activityCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  activityIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  activityMeta: { flex: 1, marginLeft: 16 },
  activityTitle: { fontSize: 16, fontWeight: '800' },
  activityDate: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  activityValues: { alignItems: 'flex-end' },
  activityDataText: { fontSize: 17, fontWeight: '800' },
  activitySubDataText: { fontSize: 13, marginTop: 2, fontWeight: '500' },
});