import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../services/supabase';
import { ThemeContext } from '../contexts/ThemeContext'; // Usando o tema global!

export default function Explorar() {
  const { isDark } = useContext(ThemeContext);
  
  const [locais, setLocais] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [sugestoes, setSugestoes] = useState([]);
  const [minhaLocalizacao, setMinhaLocalizacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detalheVisible, setDetalheVisible] = useState(false);
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const [modalidadeAtiva, setModalidadeAtiva] = useState(null);

  const theme = {
    bg: isDark ? '#0B1120' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    subtext: isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    border: isDark ? '#334155' : '#E2E8F0',
    hero: isDark ? '#0F2035' : '#E2E8F0',
    heroGlow: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.12)',
  };

  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1); 
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        let userLat = 0; let userLng = 0;
        if (status === 'granted') {
          let currentLocation = await Location.getCurrentPositionAsync({});
          userLat = currentLocation.coords.latitude;
          userLng = currentLocation.coords.longitude;
          setMinhaLocalizacao({ latitude: userLat, longitude: userLng });
        }

        const [{ data: locaisDB, error }, { data: modalidadesDB }, { data: sugestoesDB }] = await Promise.all([
          supabase.from('locais').select('*'),
          supabase.from('modalidades').select('id, nome, icone').order('nome'),
          supabase.from('sugestoes_ia').select('id, local_id, local_nome, latitude, longitude, score, fonte, modalidade_id').order('criado_em', { ascending: false }),
        ]);
        if (error) throw error;

        const locaisComDistancia = (locaisDB || []).map(local => ({
          ...local,
          distancia: status === 'granted' ? calcularDistancia(userLat, userLng, local.latitude, local.longitude) : '?'
        })).sort((a, b) => a.distancia - b.distancia);

        setLocais(locaisComDistancia);
        setModalidades(modalidadesDB || []);
        setSugestoes(sugestoesDB || []);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar os locais.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const abrirRotaNoNativo = (lat, lng, nome) => {
    const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const label = nome;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    Linking.openURL(url);
  };

  const abrirUrl = (url) => {
    if (!url) return;
    Linking.openURL(url);
  };

  const locaisFiltrados = useMemo(() => {
    if (!modalidadeAtiva) return locais;
    return locais.filter(local => local.modalidade_id === modalidadeAtiva);
  }, [locais, modalidadeAtiva]);

  const sugestoesEnriquecidas = useMemo(() => {
    if (!sugestoes.length) return [];
    const locaisById = new Map(locais.map(local => [local.id, local]));
    return sugestoes.map((sugestao) => {
      const local = sugestao.local_id ? locaisById.get(sugestao.local_id) : null;
      return {
        ...sugestao,
        local: local || null,
      };
    });
  }, [sugestoes, locais]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <View style={[styles.heroCard, { backgroundColor: theme.hero, borderColor: theme.border }]}
        >
          <View style={[styles.heroGlow, { backgroundColor: theme.heroGlow }]} />
          <Text style={[styles.heroTitle, { color: theme.text }]}>Explorar Locais</Text>
          <Text style={[styles.heroSubtitle, { color: theme.subtext }]}>Parques, quadras e pistas perto de voce</Text>
          <View style={styles.heroRow}>
            <View style={[styles.heroPill, { borderColor: theme.border }]}
            >
              <MaterialCommunityIcons name="map-marker-distance" size={14} color={theme.accent} />
              <Text style={[styles.heroPillText, { color: theme.text }]}>Perto de voce</Text>
            </View>
            <View style={[styles.heroPill, { borderColor: theme.border }]}
            >
              <MaterialCommunityIcons name="robot-outline" size={14} color={theme.accent} />
              <Text style={[styles.heroPillText, { color: theme.text }]}>Sugestoes IA</Text>
            </View>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.subtext, marginTop: 10 }}>Buscando locais e seu GPS...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <TouchableOpacity
              style={[styles.chip, { borderColor: theme.border, backgroundColor: modalidadeAtiva ? 'transparent' : theme.card }]}
              onPress={() => setModalidadeAtiva(null)}
            >
              <Text style={[styles.chipText, { color: theme.text }]}>Todas</Text>
            </TouchableOpacity>
            {modalidades.map((mod) => (
              <TouchableOpacity
                key={mod.id}
                style={[styles.chip, { borderColor: theme.border, backgroundColor: modalidadeAtiva === mod.id ? theme.card : 'transparent' }]}
                onPress={() => setModalidadeAtiva(mod.id)}
              >
                <MaterialCommunityIcons name={mod.icone || 'run'} size={14} color={theme.accent} />
                <Text style={[styles.chipText, { color: theme.text }]}>{mod.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* MAPA PEQUENO NO TOPO */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: minhaLocalizacao ? minhaLocalizacao.latitude : -23.6815, // Padrão Diadema
                longitude: minhaLocalizacao ? minhaLocalizacao.longitude : -46.6205,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              showsUserLocation={true}
              userInterfaceStyle={isDark ? 'dark' : 'light'}
            >
              {locaisFiltrados.map(local => (
                <Marker key={local.id} coordinate={{ latitude: parseFloat(local.latitude), longitude: parseFloat(local.longitude) }} title={local.nome} description={local.tipo} />
              ))}
            </MapView>
          </View>

          <View style={{ paddingHorizontal: 24 }}>
            {sugestoesEnriquecidas.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Sugestoes da IA</Text>
                  <Text style={[styles.sectionHint, { color: theme.subtext }]}>Baseado no seu perfil</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                  {sugestoesEnriquecidas.map((item) => {
                    const local = item.local;
                    const nome = local?.nome || item.local_nome || 'Local sugerido';
                    const distancia = local?.distancia || (item.latitude && minhaLocalizacao
                      ? calcularDistancia(minhaLocalizacao.latitude, minhaLocalizacao.longitude, item.latitude, item.longitude)
                      : null);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.suggestionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={() => {
                          if (local) {
                            setLocalSelecionado(local);
                            setDetalheVisible(true);
                          }
                        }}
                      >
                        <View style={[styles.suggestionBadge, { backgroundColor: `${theme.accent}15` }]}
                        >
                          <MaterialCommunityIcons name="sparkles" size={14} color={theme.accent} />
                          <Text style={[styles.suggestionBadgeText, { color: theme.accent }]}>IA</Text>
                        </View>
                        <Text style={[styles.suggestionTitle, { color: theme.text }]} numberOfLines={2}>{nome}</Text>
                        <Text style={[styles.suggestionMeta, { color: theme.subtext }]}
                        >{distancia ? `${distancia} km` : 'Perto de voce'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Mais Próximos de Você</Text>
            
            {locaisFiltrados.map((local) => (
              <TouchableOpacity 
                key={local.id} 
                style={[styles.placeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setLocalSelecionado(local);
                  setDetalheVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.placeIconArea, { backgroundColor: `${theme.accent}15` }]}>
                  <MaterialCommunityIcons name={local.icone} size={28} color={theme.accent} />
                </View>
                <View style={styles.placeInfo}>
                  <Text style={[styles.placeName, { color: theme.text }]}>{local.nome}</Text>
                  <Text style={[styles.placeCity, { color: theme.subtext }]}>{local.cidade}</Text>
                  <View style={styles.tagsRow}>
                    <View style={styles.badgeContainer}>
                      <Text style={[styles.badgeText, { color: theme.accent }]}>{local.tipo}</Text>
                    </View>
                    {local.nivel ? (
                      <View style={styles.levelBadge}>
                        <Text style={[styles.levelText, { color: theme.subtext }]}>{local.nivel}</Text>
                      </View>
                    ) : null}
                    <Text style={[styles.distText, { color: theme.subtext }]}>
                      <MaterialCommunityIcons name="map-marker-distance" size={14} /> {local.distancia} km
                    </Text>
                  </View>
                </View>
                <View style={styles.routeBtn}>
                  <MaterialCommunityIcons name="navigation" size={24} color="#3B82F6" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      )}

      <Modal animationType="slide" transparent visible={detalheVisible} onRequestClose={() => setDetalheVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setDetalheVisible(false)}>
          <Pressable style={[styles.detailSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

            <Text style={[styles.detailTitle, { color: theme.text }]}>
              {localSelecionado?.nome || 'Local'}
            </Text>
            {localSelecionado?.categoria && (
              <Text style={[styles.detailSub, { color: theme.subtext }]}>Categoria: {localSelecionado.categoria}</Text>
            )}
            {localSelecionado?.descricao && (
              <Text style={[styles.detailDesc, { color: theme.subtext }]}>{localSelecionado.descricao}</Text>
            )}

            <View style={styles.detailGrid}>
              {localSelecionado?.endereco && (
                <Text style={[styles.detailItem, { color: theme.text }]}>Endereco: {localSelecionado.endereco}</Text>
              )}
              {localSelecionado?.horario && (
                <Text style={[styles.detailItem, { color: theme.text }]}>Horario: {localSelecionado.horario}</Text>
              )}
              {localSelecionado?.telefone && (
                <Text style={[styles.detailItem, { color: theme.text }]}>Telefone: {localSelecionado.telefone}</Text>
              )}
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.accent }]}
                onPress={() => {
                  if (!localSelecionado) return;
                  abrirRotaNoNativo(localSelecionado.latitude, localSelecionado.longitude, localSelecionado.nome);
                }}
              >
                <MaterialCommunityIcons name="navigation" size={18} color="#FFF" />
                <Text style={styles.actionText}>Abrir rota</Text>
              </TouchableOpacity>

              {localSelecionado?.url ? (
                <TouchableOpacity
                  style={[styles.actionBtnOutline, { borderColor: theme.border }]}
                  onPress={() => abrirUrl(localSelecionado.url)}
                >
                  <MaterialCommunityIcons name="web" size={18} color={theme.text} />
                  <Text style={[styles.actionTextOutline, { color: theme.text }]}>Ver site</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  heroCard: { borderRadius: 24, padding: 18, borderWidth: 1, overflow: 'hidden' },
  heroGlow: { position: 'absolute', top: -40, right: -30, width: 120, height: 120, borderRadius: 999 },
  heroTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  heroRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  heroPillText: { fontSize: 11, fontWeight: '700' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chipsRow: { paddingHorizontal: 20, paddingBottom: 14, gap: 8, alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },
  
  mapContainer: { height: 250, marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 24, elevation: 4 },
  map: { flex: 1 },

  sectionBlock: { marginBottom: 22 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  sectionHint: { fontSize: 12, fontWeight: '600', marginBottom: 16 },
  suggestionRow: { paddingBottom: 4, gap: 12 },
  suggestionCard: { width: 180, borderRadius: 18, borderWidth: 1, padding: 14 },
  suggestionBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginBottom: 10 },
  suggestionBadgeText: { fontSize: 10, fontWeight: '800' },
  suggestionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  suggestionMeta: { fontSize: 12, fontWeight: '600' },
  placeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  placeIconArea: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  placeCity: { fontSize: 13, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badgeContainer: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  levelBadge: { backgroundColor: 'rgba(100,116,139,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  levelText: { fontSize: 11, fontWeight: '700' },
  distText: { fontSize: 12, fontWeight: '600' },
  
  routeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  detailSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1 },
  sheetHandle: { width: 48, height: 4, borderRadius: 99, alignSelf: 'center', marginBottom: 14 },
  detailTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  detailSub: { fontSize: 13, marginBottom: 8 },
  detailDesc: { fontSize: 14, marginBottom: 12 },
  detailGrid: { gap: 6, marginBottom: 16 },
  detailItem: { fontSize: 13, fontWeight: '600' },
  detailActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  actionText: { color: '#FFF', fontWeight: '700' },
  actionBtnOutline: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  actionTextOutline: { fontWeight: '700' }
});