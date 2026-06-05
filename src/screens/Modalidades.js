import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { ThemeContext } from '../contexts/ThemeContext';

export default function Modalidades({ navigation }) {
  const { isDark } = useContext(ThemeContext);
  const [modalidades, setModalidades] = useState([]);
  const [loading, setLoading] = useState(true);

  const C = {
    bg: isDark ? '#0B1120' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    sub: isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: mods } = await supabase
          .from('modalidades')
          .select('id, nome, icone, descricao, usa_gps')
          .order('nome');
        setModalidades(mods || []);
      } catch (error) {
        Alert.alert('Erro', 'Nao foi possivel carregar as modalidades.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const abrirDetalhe = (modalidade) => {
    navigation.navigate('ModalidadeDetalhe', { modalidade });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Modalidades</Text>
        <Text style={[styles.subtitle, { color: C.sub }]}>Escolha um esporte para ver dicas e videos</Text>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={{ color: C.sub, marginTop: 10 }}>Carregando modalidades...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.grid}>
            {modalidades.map((mod) => (
              <TouchableOpacity
                key={mod.id}
                style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}
                activeOpacity={0.85}
                onPress={() => abrirDetalhe(mod)}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${C.accent}15` }]}
                >
                  <MaterialCommunityIcons name={mod.icone || 'run'} size={26} color={C.accent} />
                </View>
                <Text style={[styles.cardTitle, { color: C.text }]}>{mod.nome}</Text>
                {mod.descricao ? (
                  <Text style={[styles.cardSub, { color: C.sub }]} numberOfLines={2}>{mod.descricao}</Text>
                ) : null}
                <View style={styles.cardFooter}>
                  <View style={[styles.badge, { backgroundColor: `${C.accent}20` }]}
                  >
                    <Text style={[styles.badgeText, { color: C.accent }]}>Abrir detalhes</Text>
                  </View>
                  {mod.usa_gps ? (
                    <MaterialCommunityIcons name="satellite-uplink" size={16} color={C.accent} />
                  ) : (
                    <MaterialCommunityIcons name="timer-outline" size={16} color={C.sub} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 4, fontSize: 13, fontWeight: '600' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  card: { width: '48%', borderRadius: 20, borderWidth: 1, padding: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  cardSub: { fontSize: 12, fontWeight: '500', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
