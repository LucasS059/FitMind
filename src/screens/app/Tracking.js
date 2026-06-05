import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, 
  Modal, FlatList, ActivityIndicator 
} from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

const haversineKm = (c1, c2) => {
  const R = 6371;
  const dLat = (c2.latitude - c1.latitude) * Math.PI / 180;
  const dLon = (c2.longitude - c1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(c1.latitude * Math.PI / 180) *
    Math.cos(c2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function Tracking({ navigation }) {
  const { isDark, colors } = useContext(ThemeContext);

  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const locationSubRef = useRef(null);

  const [isTracking, setIsTracking] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [distanciaKm, setDistanciaKm] = useState(0);
  const [pesoPerfil, setPesoPerfil] = useState(70);

  const [modalidades, setModalidades] = useState([]);
  const [modalidadeAtiva, setModalidadeAtiva] = useState(null); // começa sem seleção
  const [showSelector, setShowSelector] = useState(false);
  
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: perfil } = await supabase.from('perfis').select('peso_kg').eq('id', user.id).single();
      if (perfil?.peso_kg) setPesoPerfil(perfil.peso_kg);

      const { data: mods } = await supabase
        .from('modalidades')
        .select('*')
        .eq('usa_gps', true) 
        .order('nome');

      if (mods && mods.length > 0) {
        setModalidades(mods);
        // Abre o seletor automaticamente ao entrar no ecrã
        setShowSelector(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(loc.coords);
      } else {
        Alert.alert('Aviso', 'Precisamos do GPS para gravar o seu treino.');
      }
    })();
    return () => { locationSubRef.current?.remove(); };
  }, []);

  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      setIsTracking(true);
      setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => setTempo(prev => prev + 1), 1000);

      if (modalidadeAtiva?.usa_gps) {
        (async () => {
          const sub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 5 },
            (newLoc) => {
              const coords = newLoc.coords;
              setLocation(coords);
              setRouteCoords(prev => {
                if (prev.length > 0) {
                  const segmento = haversineKm(prev[prev.length - 1], coords);
                  if (segmento < 0.05) setDistanciaKm(d => d + segmento);
                }
                return [...prev, coords];
              });
            }
          );
          locationSubRef.current = sub;
        })();
      }
    } else {
      clearInterval(interval);
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    }
    return () => clearInterval(interval);
  }, [isTracking, modalidadeAtiva]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const getMET = () => {
    if (!modalidadeAtiva) return 5.0;
    const nome = modalidadeAtiva.nome.toLowerCase();
    if (nome === 'corrida') return 8.0;
    if (nome === 'ciclismo') return 6.8;
    return 5.0;
  };

  const caloriasTotais = Math.round(getMET() * pesoPerfil * (tempo / 3600));
  const tempoMinutos = Math.floor(tempo / 60);

  const iniciarComContagem = () => {
    // Obriga a escolher modalidade antes de iniciar
    if (!modalidadeAtiva) {
      setShowSelector(true);
      return;
    }
    setShowSelector(false);
    setCountdown(5);
  };

  const cancelarContagem = () => {
    setCountdown(null);
  };

  const salvarTreino = async () => {
    if (tempoMinutos < 1 && distanciaKm < 0.1) {
      Alert.alert('Treino muito curto', 'Grave um pouco mais de atividade antes de salvar.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('treinos').insert({
        perfil_id: user.id,
        modalidade_id: modalidadeAtiva.id,
        distancia_km: parseFloat(distanciaKm.toFixed(2)),
        duracao_minutos: tempoMinutos,
        calorias: caloriasTotais > 0 ? caloriasTotais : 1,
        rota: routeCoords.length > 0 ? routeCoords : null 
      });

      if (error) throw error;

      Alert.alert('✅ Missão Cumprida', 'Treino salvo com sucesso.', [
        { text: 'OK', onPress: () => navigation.replace('MainTabs') }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar: ' + error.message);
    }
  };

  const descartarTreino = () => {
    Alert.alert('Descartar treino?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* MAPA */}
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
          showsUserLocation
          followsUserLocation={isTracking}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
        >
          {modalidadeAtiva?.usa_gps && routeCoords.length > 1 && (
            <Polyline coordinates={routeCoords} strokeColor={colors.accent} strokeWidth={6} lineCap="round" lineJoin="round" />
          )}
        </MapView>
      ) : (
        <View style={[styles.loadingMap, { backgroundColor: colors.bg }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.sub, marginTop: 12, fontWeight: '600' }}>Buscando satélites...</Text>
        </View>
      )}

      {/* TOP BAR */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={[styles.gpsBadge, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="satellite-variant" size={16} color={location ? colors.accent : colors.sub} />
          <Text style={[styles.gpsText, { color: colors.text }]}>{location ? 'GPS Pronto' : 'Buscando...'}</Text>
        </View>
      </SafeAreaView>

      {/* BOTTOM PANEL */}
      <View style={styles.bottomOverlay}>
        <View style={[styles.trackingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          <View style={styles.cardHeader}>
            {!isTracking && tempo === 0 ? (
              <TouchableOpacity 
                style={[styles.sportSelectorBtn, { backgroundColor: isDark ? '#0B1120' : '#F1F5F9' }]} 
                onPress={() => setShowSelector(true)}
              >
                <MaterialCommunityIcons name={modalidadeAtiva?.icone || 'help-circle-outline'} size={18} color={colors.text} />
                {/* Mostra "Escolher" se ainda não selecionou */}
                <Text style={[styles.sportSelectorText, { color: modalidadeAtiva ? colors.text : colors.accent }]}>
                  {modalidadeAtiva?.nome || 'Escolher modalidade'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color={colors.sub} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.activeSportBadge, { backgroundColor: isDark ? '#0B1120' : '#F1F5F9' }]}>
                <MaterialCommunityIcons name={modalidadeAtiva?.icone || 'run'} size={18} color={colors.accent} />
                <Text style={[styles.activeSportText, { color: colors.text }]}>{modalidadeAtiva?.nome}</Text>
              </View>
            )}
            
            {tempo > 0 && (
              <View style={styles.recordingStatus}>
                <View style={[styles.pulseDot, { backgroundColor: isTracking ? '#EF4444' : colors.sub }]} />
                <Text style={[styles.recordingText, { color: colors.sub }]}>{isTracking ? 'Gravando' : 'Pausado'}</Text>
              </View>
            )}
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatTime(tempo)}</Text>
              <Text style={[styles.statLabel, { color: colors.sub }]}>Tempo</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{distanciaKm.toFixed(2)}</Text>
              <Text style={[styles.statLabel, { color: colors.sub }]}>Km</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{caloriasTotais}</Text>
              <Text style={[styles.statLabel, { color: colors.sub }]}>Kcal</Text>
            </View>
          </View>

          {/* Botões de Ação */}
          {tempo === 0 ? (
            <TouchableOpacity 
              style={[styles.mainActionBtn, { backgroundColor: colors.accent }]} 
              onPress={iniciarComContagem}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="play" size={24} color="#FFF" />
              <Text style={styles.mainActionText}>INICIAR TREINO</Text>
            </TouchableOpacity>
          ) : isTracking ? (
            <TouchableOpacity 
              style={[styles.mainActionBtn, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} 
              onPress={() => setIsTracking(false)}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="pause" size={24} color={colors.text} />
              <Text style={[styles.mainActionText, { color: colors.text }]}>PAUSAR</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pausedControlsRow}>
              <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: '#EF4444' }]} onPress={descartarTreino}>
                <MaterialCommunityIcons name="delete" size={22} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.resumeBtn, { backgroundColor: colors.text }]} onPress={iniciarComContagem}>
                <Text style={[styles.resumeBtnText, { color: colors.card }]}>RETOMAR</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.accent }]} onPress={salvarTreino}>
                <MaterialCommunityIcons name="check-bold" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* OVERLAY DE COUNTDOWN (5 SEGUNDOS) */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <Text style={[styles.countdownNumber, { color: colors.accent }]}>{countdown}</Text>
          <Text style={styles.countdownSub}>Prepara-te...</Text>
          
          <TouchableOpacity style={styles.cancelCountdownBtn} onPress={cancelarContagem}>
            <Text style={styles.cancelCountdownText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL PARA ESCOLHER MODALIDADE */}
      <Modal visible={showSelector} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowSelector(false)} 
          />
          
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Escolhe a modalidade</Text>
              
              <TouchableOpacity onPress={() => setShowSelector(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.sub} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={modalidades}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalItem, modalidadeAtiva?.id === item.id && { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}
                  onPress={() => { 
                    setModalidadeAtiva(item); 
                    setShowSelector(false); 
                  }}
                >
                  <View style={[styles.modalIconBox, { backgroundColor: modalidadeAtiva?.id === item.id ? colors.accent : colors.divider }]}>
                    <MaterialCommunityIcons name={item.icone || 'run'} size={20} color={modalidadeAtiva?.id === item.id ? '#FFF' : colors.sub} />
                  </View>
                  <Text style={[styles.modalItemText, { color: colors.text }, modalidadeAtiva?.id === item.id && { fontWeight: '800' }]}>
                    {item.nome}
                  </Text>
                  {modalidadeAtiva?.id === item.id && <MaterialCommunityIcons name="check" size={20} color={colors.accent} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, marginBottom: 180 },
  loadingMap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  topBar: { position: 'absolute', top: 10, left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1 },
  gpsText: { fontSize: 13, fontWeight: '700' },

  bottomOverlay: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  
  trackingCard: { borderRadius: 28, padding: 20, borderWidth: 1, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sportSelectorBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  sportSelectorText: { fontSize: 14, fontWeight: '700' },
  activeSportBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  activeSportText: { fontSize: 14, fontWeight: '800' },
  
  recordingStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  recordingText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  statDivider: { width: 1, height: '100%' },

  mainActionBtn: { flexDirection: 'row', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 2 },
  mainActionText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  pausedControlsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  secondaryBtn: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  resumeBtn: { flex: 1, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  resumeBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  countdownOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 100
  },
  countdownNumber: { fontSize: 140, fontWeight: '900', textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },
  countdownSub: { fontSize: 20, fontWeight: '600', color: '#FFF', marginTop: -10, marginBottom: 60 },
  cancelCountdownBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24, borderWidth: 2, borderColor: '#FFF' },
  cancelCountdownText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  modalIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalItemText: { fontSize: 16, fontWeight: '600' },
});