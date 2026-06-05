import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function Explorar() {
  const { isDark, colors } = useContext(ThemeContext);
  
  const [locais, setLocais] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [minhaLocalizacao, setMinhaLocalizacao] = useState(null);
  
  // Estados de Controle de UI
  const [loading, setLoading] = useState(true);
  const [isFetchingMap, setIsFetchingMap] = useState(false);
  const [detalheVisible, setDetalheVisible] = useState(false);
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const [modalidadeAtiva, setModalidadeAtiva] = useState(null);
  
  // Estados Novos: Raio e Paginação
  const [raioBuscaKm, setRaioBuscaKm] = useState(3); // 1, 3 ou 5 km
  const [itensVisiveis, setItensVisiveis] = useState(5); // Começa mostrando 5 itens

  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return (R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))).toFixed(1); 
  };

  // 1. EFEITO INICIAL: Pega GPS e Modalidades uma única vez
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        let userLat = -23.6815; // Padrão
        let userLng = -46.6205; 
        
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          userLat = loc.coords.latitude;
          userLng = loc.coords.longitude;
        }
        setMinhaLocalizacao({ latitude: userLat, longitude: userLng });

        const { data: modalidadesDB } = await supabase.from('modalidades').select('id, nome, icone');
        setModalidades(modalidadesDB || []);
      } catch (error) {
        console.error("Erro no GPS:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. EFEITO SECUNDÁRIO: Busca no OpenStreetMap sempre que a localização ou o RAIO mudar
  useEffect(() => {
    if (!minhaLocalizacao) return;

    // Criamos um AbortController para cancelar requisições "encavaladas"
    const abortController = new AbortController();

    (async () => {
      try {
        setIsFetchingMap(true);
        const radiusMeters = raioBuscaKm * 1000;
        const { latitude: lat, longitude: lng } = minhaLocalizacao;

        const queryOSM = `
          [out:json];
          (
            node["leisure"="park"](around:${radiusMeters},${lat},${lng});
            way["leisure"="park"](around:${radiusMeters},${lat},${lng});
            node["leisure"="pitch"](around:${radiusMeters},${lat},${lng});
            way["leisure"="pitch"](around:${radiusMeters},${lat},${lng});
          );
          out center tags;
        `;
        
        const resOSM = await fetch(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryOSM)}`,
          { signal: abortController.signal } // Atrela o cancelamento aqui
        );

        if (!resOSM.ok) {
          throw new Error('Servidor de mapas ocupado ou erro na rede.');
        }

        const dataOSM = await resOSM.json();

        const locaisReais = dataOSM.elements
          .map(el => {
            const localLat = el.lat || el.center?.lat;
            const localLon = el.lon || el.center?.lon;
            const isPark = el.tags?.leisure === 'park';
            const nomeLocal = el.tags?.name || '';
            const esporteInfo = el.tags?.sport || ''; 
            
            return {
              id: el.id.toString(),
              nome: nomeLocal || (isPark ? 'Parque Público' : 'Quadra Esportiva'),
              latitude: localLat,
              longitude: localLon,
              tipo: isPark ? 'Parque' : 'Quadra',
              esporte: esporteInfo.toLowerCase(), 
              icone: isPark ? 'tree' : 'basketball',
              endereco: 'Endereço mapeado na região',
              distancia: calcularDistancia(lat, lng, localLat, localLon)
            };
          })
          .filter(local => local.nome !== 'Parque Público' && local.nome !== 'Quadra Esportiva')
          .sort((a, b) => a.distancia - b.distancia);

        setLocais(locaisReais); 
        setItensVisiveis(5); 

      } catch (error) {
        if (error.name === 'AbortError') return;
        
        console.log("Aviso de Mapa: Não foi possível atualizar os dados agora.", error.message);
      } finally {
        setIsFetchingMap(false);
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [minhaLocalizacao, raioBuscaKm])

  const alternarRaio = () => {
    setRaioBuscaKm(prev => prev === 1 ? 3 : prev === 3 ? 5 : 1);
  };

  const abrirRotaNoNativo = (lat, lng, nome) => {
    const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
    Linking.openURL(Platform.select({ ios: `${scheme}${nome}@${lat},${lng}`, android: `${scheme}${lat},${lng}(${nome})` }));
  };

  const locaisFiltrados = useMemo(() => {
    if (!modalidadeAtiva) {
      return locais.filter(l => !l.nome.toLowerCase().includes('praça'));
    }
    
    const modName = modalidades.find(m => m.id === modalidadeAtiva)?.nome.toLowerCase() || '';
    
    if (modName.includes('tênis') || modName.includes('tennis')) {
      return locais.filter(l => l.esporte.includes('tennis'));
    } 
    else if (modName.includes('basquete') || modName.includes('basketball')) {
      return locais.filter(l => l.esporte.includes('basketball'));
    }
    else if (modName.includes('futsal') || modName.includes('futebol') || modName.includes('soccer')) {
      return locais.filter(l => l.esporte.includes('soccer'));
    }
    else if (modName.includes('vôlei') || modName.includes('volleyball')) {
      return locais.filter(l => l.esporte.includes('volleyball'));
    }
    else if (modName.includes('ciclismo') || modName.includes('bicicleta')) {
      return locais.filter(l => l.tipo === 'Parque' && !l.nome.toLowerCase().includes('praça'));
    }
    else if (modName.includes('corrid') || modName.includes('caminhada')) {
      return locais.filter(l => l.tipo === 'Parque');
    }

    return locais;
  }, [locais, modalidadeAtiva, modalidades]);

  const topSugestoes = locaisFiltrados.slice(0, 3);
  const locaisPaginados = locaisFiltrados.slice(0, itensVisiveis);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerLoading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.sub, marginTop: 16, fontWeight: '600' }}>Iniciando radares...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      
      {/* Header com Ajuste de Raio ao invés da Lupa */}
      <View style={styles.topHeader}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Explorar</Text>
        <TouchableOpacity 
          style={[styles.radiusBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={alternarRaio}
          disabled={isFetchingMap}
        >
          {isFetchingMap ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <MaterialCommunityIcons name="radar" size={18} color={colors.accent} />
              <Text style={[styles.radiusText, { color: colors.text }]}>{raioBuscaKm} km</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Chips de Filtro */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <TouchableOpacity 
            style={[
              styles.chip, 
              modalidadeAtiva === null ? { backgroundColor: colors.text, borderColor: colors.text } : { backgroundColor: colors.card, borderColor: colors.border }
            ]}
            onPress={() => { setModalidadeAtiva(null); setItensVisiveis(5); }}
          >
            <Text style={[styles.chipText, { color: modalidadeAtiva === null ? colors.bg : colors.text }]}>Todos</Text>
          </TouchableOpacity>
          {modalidades.map((mod) => {
            const isActive = modalidadeAtiva === mod.id;
            return (
              <TouchableOpacity
                key={mod.id}
                style={[
                  styles.chip, 
                  isActive ? { backgroundColor: colors.text, borderColor: colors.text } : { backgroundColor: colors.card, borderColor: colors.border }
                ]}
                onPress={() => { setModalidadeAtiva(mod.id); setItensVisiveis(5); }}
              >
                <Text style={[styles.chipText, { color: isActive ? colors.bg : colors.text }]}>{mod.nome}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Mapa Interativo em Destaque */}
        <View style={[styles.mapWrapper, { borderColor: colors.border }]}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: minhaLocalizacao?.latitude || -23.6815,
              longitude: minhaLocalizacao?.longitude || -46.6205,
              latitudeDelta: raioBuscaKm === 1 ? 0.02 : raioBuscaKm === 3 ? 0.06 : 0.1, // Zoom dinâmico
              longitudeDelta: raioBuscaKm === 1 ? 0.02 : raioBuscaKm === 3 ? 0.06 : 0.1,
            }}
            showsUserLocation={true}
            userInterfaceStyle={isDark ? 'dark' : 'light'}
            pitchEnabled={false}
          >
            {locaisFiltrados.map(local => (
              <Marker 
                key={local.id} 
                coordinate={{ latitude: parseFloat(local.latitude), longitude: parseFloat(local.longitude) }} 
                onPress={() => { setLocalSelecionado(local); setDetalheVisible(true); }}
              >
                <View style={[styles.markerBody, { backgroundColor: colors.accent }]}>
                  <MaterialCommunityIcons name={local.icone || 'map-marker'} size={18} color="#FFF" />
                </View>
                <View style={[styles.markerArrow, { borderTopColor: colors.accent }]} />
              </Marker>
            ))}
          </MapView>
        </View>

        {/* Principais (Top 3) */}
        {topSugestoes.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Destaques Próximos</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
              {topSugestoes.map((item) => (
                <TouchableOpacity
                  key={`destaque-${item.id}`}
                  style={[styles.suggestionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => { setLocalSelecionado(item); setDetalheVisible(true); }}
                  activeOpacity={0.8}
                >
                  <View style={styles.suggestionHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.divider }]}>
                      <MaterialCommunityIcons name={item.icone || 'map-marker'} size={20} color={colors.accent} />
                    </View>
                  </View>
                  <View style={styles.suggestionFooter}>
                    <Text style={[styles.suggestionTitle, { color: colors.text }]} numberOfLines={2}>{item.nome}</Text>
                    <Text style={[styles.suggestionMeta, { color: colors.sub }]}>{item.distancia} km daqui</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Lista Paginada (Evita scroll infinito) */}
        {locaisPaginados.length > 0 && (
          <View style={styles.listSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Resultados</Text>
            {locaisPaginados.map((local) => (
              <TouchableOpacity 
                key={`lista-${local.id}`} 
                style={[styles.placeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { setLocalSelecionado(local); setDetalheVisible(true); }}
                activeOpacity={0.7}
              >
                <View style={[styles.placeIconArea, { backgroundColor: colors.divider }]}>
                  <MaterialCommunityIcons name={local.icone || 'map-marker'} size={24} color={colors.sub} />
                </View>
                <View style={styles.placeInfo}>
                  <Text style={[styles.placeName, { color: colors.text }]}>{local.nome}</Text>
                  <Text style={[styles.placeCity, { color: colors.sub }]}>{local.tipo}</Text>
                  <View style={styles.tagsRow}>
                    <View style={styles.distBadge}>
                      <MaterialCommunityIcons name="map-marker-distance" size={14} color={colors.sub} />
                      <Text style={[styles.distText, { color: colors.sub }]}>{local.distancia} km</Text>
                    </View>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.sub} />
              </TouchableOpacity>
            ))}

            {/* BOTÃO CARREGAR MAIS */}
            {locaisFiltrados.length > itensVisiveis && (
              <TouchableOpacity 
                style={[styles.loadMoreBtn, { borderColor: colors.border }]} 
                onPress={() => setItensVisiveis(prev => prev + 5)}
              >
                <Text style={[styles.loadMoreText, { color: colors.text }]}>Carregar mais</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de Detalhes */}
      <Modal animationType="slide" transparent visible={detalheVisible} onRequestClose={() => setDetalheVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setDetalheVisible(false)}>
          <Pressable style={[styles.detailSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.divider }]} />

            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIconBox, { backgroundColor: colors.divider }]}>
                <MaterialCommunityIcons name={localSelecionado?.icone || 'map-marker'} size={32} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{localSelecionado?.nome}</Text>
                <Text style={[styles.detailSub, { color: colors.sub }]}>{localSelecionado?.tipo} • {localSelecionado?.distancia} km</Text>
              </View>
            </View>

            <View style={[styles.detailGrid, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <View style={styles.gridItem}>
                <MaterialCommunityIcons name="compass-outline" size={18} color={colors.sub} />
                <Text style={[styles.gridText, { color: colors.text }]}>{localSelecionado?.endereco}</Text>
              </View>
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                onPress={() => abrirRotaNoNativo(localSelecionado.latitude, localSelecionado.longitude, localSelecionado.nome)}
              >
                <MaterialCommunityIcons name="navigation" size={20} color="#FFF" />
                <Text style={[styles.actionText, { color: '#FFF' }]}>Iniciar Rota</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  radiusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 12, borderWidth: 1 },
  radiusText: { fontSize: 14, fontWeight: '700' },
  
  chipsRow: { paddingHorizontal: 20, paddingBottom: 20, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: '600' },
  
  mapWrapper: { height: 260, marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 24, borderWidth: 1 },
  map: { flex: 1 },
  markerBody: { padding: 6, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  markerArrow: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', alignSelf: 'center' },

  sectionBlock: { marginBottom: 24 },
  sectionHeaderRow: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  suggestionRow: { paddingHorizontal: 20, gap: 12 },
  suggestionCard: { width: 180, height: 140, borderRadius: 20, padding: 16, justifyContent: 'space-between', borderWidth: 1 },
  suggestionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  suggestionFooter: { gap: 4 },
  suggestionTitle: { fontSize: 16, fontWeight: '700' },
  suggestionMeta: { fontSize: 13, fontWeight: '500' },

  listSection: { paddingHorizontal: 20 },
  placeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  placeIconArea: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  placeCity: { fontSize: 13, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distText: { fontSize: 12, fontWeight: '600' },
  
  loadMoreBtn: { paddingVertical: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginTop: 10, borderStyle: 'dashed' },
  loadMoreText: { fontSize: 15, fontWeight: '600' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1, borderBottomWidth: 0 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  sheetHeader: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 24 },
  sheetIconBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  detailTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  detailSub: { fontSize: 14, fontWeight: '500' },
  detailGrid: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  gridItem: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  gridText: { fontSize: 14, fontWeight: '500', flex: 1 },
  detailActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  actionText: { fontSize: 16, fontWeight: '700' }
});