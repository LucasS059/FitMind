import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function ModalidadeDetalhe({ navigation, route }) {
  const { modalidade } = route.params || {};
  const { isDark } = useContext(ThemeContext);

  const [dicas, setDicas] = useState([]);
  const [locais, setLocais] = useState([]);
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
    if (!modalidade?.id) return;
    (async () => {
      try {
        setLoading(true);
        const [{ data: dicasDB }, { data: locaisDB }] = await Promise.all([
          supabase
            .from('dicas')
            .select('id, titulo, subtitulo, youtube_url, alongamento, aquecimento, como_praticar, icone, cor')
            .eq('modalidade_id', modalidade.id)
            .order('criado_em', { ascending: false }),
          supabase
            .from('locais')
            .select('id, nome, cidade, categoria, nivel, tipo, icone, latitude, longitude, endereco, descricao, horario, url')
            .eq('modalidade_id', modalidade.id),
        ]);
        setDicas(dicasDB || []);
        setLocais(locaisDB || []);
      } catch (error) {
        Alert.alert('Erro', 'Nao foi possivel carregar os dados.');
      } finally {
        setLoading(false);
      }
    })();
  }, [modalidade?.id]);

  const abrirRota = (local) => {
    const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${local.latitude},${local.longitude}`;
    const label = local.nome;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    Linking.openURL(url);
  };

  const abrirDica = (dica) => {
    navigation.navigate('Dicas', {
      atividade: {
        id: dica.id,
        modalidade_id: modalidade.id,
        nome: dica.titulo || modalidade.nome,
        youtube_url: dica.youtube_url,
        alongamento: dica.alongamento,
        aquecimento: dica.aquecimento,
        comoPraticar: dica.como_praticar,
      },
    });
  };

  if (!modalidade) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
        <Text style={[styles.emptyText, { color: C.sub }]}>Modalidade nao encontrada.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: C.text }]}>{modalidade.nome}</Text>
        </View>

        <View style={[styles.hero, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${C.accent}18` }]}>
            <MaterialCommunityIcons name={modalidade.icone || 'run'} size={24} color={C.accent} />
          </View>
          <Text style={[styles.heroText, { color: C.sub }]}>{modalidade.descricao || 'Dicas, locais e videos para sua modalidade.'}</Text>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroBtn, { backgroundColor: C.accent }]}
              onPress={() => navigation.navigate('Tracking', { modalidade: modalidade.nome, modalidadeId: modalidade.id, usaGps: modalidade.usa_gps })}
            >
              <MaterialCommunityIcons name="play" size={16} color="#FFF" />
              <Text style={styles.heroBtnText}>Iniciar treino</Text>
            </TouchableOpacity>
            <View style={[styles.heroTag, { borderColor: C.border }]}>
              <MaterialCommunityIcons name={modalidade.usa_gps ? 'satellite-uplink' : 'timer-outline'} size={14} color={C.sub} />
              <Text style={[styles.heroTagText, { color: C.sub }]}>{modalidade.usa_gps ? 'GPS' : 'Sem GPS'}</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={C.accent} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Dicas e videos</Text>
              {dicas.length === 0 ? (
                <Text style={[styles.emptyText, { color: C.sub }]}>Nenhuma dica cadastrada.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                  {dicas.map((dica) => (
                    <TouchableOpacity
                      key={dica.id}
                      style={[styles.dicaCard, { backgroundColor: C.card, borderColor: C.border }]}
                      onPress={() => abrirDica(dica)}
                    >
                      <View style={[styles.dicaIcon, { backgroundColor: `${C.accent}18` }]}>
                        <MaterialCommunityIcons name={dica.icone || 'play'} size={18} color={C.accent} />
                      </View>
                      <Text style={[styles.dicaTitle, { color: C.text }]} numberOfLines={2}>{dica.titulo}</Text>
                      <Text style={[styles.dicaSub, { color: C.sub }]} numberOfLines={2}>{dica.subtitulo}</Text>
                      <View style={[styles.dicaBadge, { backgroundColor: `${C.accent}18` }]}>
                        <Text style={[styles.dicaBadgeText, { color: C.accent }]}>Assistir</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Locais para praticar</Text>
              {locais.length === 0 ? (
                <Text style={[styles.emptyText, { color: C.sub }]}>Nenhum local cadastrado.</Text>
              ) : (
                locais.map((local) => (
                  <TouchableOpacity
                    key={local.id}
                    style={[styles.localCard, { backgroundColor: C.card, borderColor: C.border }]}
                    onPress={() => abrirRota(local)}
                  >
                    <View style={[styles.localIcon, { backgroundColor: `${C.accent}18` }]}>
                      <MaterialCommunityIcons name={local.icone || 'map-marker'} size={18} color={C.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.localTitle, { color: C.text }]}>{local.nome}</Text>
                      <Text style={[styles.localSub, { color: C.sub }]}>{local.cidade}</Text>
                      {local.descricao ? (
                        <Text style={[styles.localSub, { color: C.sub }]} numberOfLines={2}>{local.descricao}</Text>
                      ) : null}
                    </View>
                    <MaterialCommunityIcons name="navigation" size={20} color={C.accent} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  hero: { marginHorizontal: 20, borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 22 },
  heroIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  heroText: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  heroBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  heroTagText: { fontSize: 12, fontWeight: '700' },
  centerLoading: { paddingVertical: 40 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  horizontalRow: { paddingBottom: 4, gap: 12 },
  dicaCard: { width: 200, borderRadius: 18, borderWidth: 1, padding: 14 },
  dicaIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  dicaTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  dicaSub: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  dicaBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  dicaBadgeText: { fontSize: 11, fontWeight: '700' },
  localCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  localIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  localTitle: { fontSize: 15, fontWeight: '800' },
  localSub: { fontSize: 12, fontWeight: '600' },
  emptyText: { fontSize: 13, fontWeight: '600' },
});
