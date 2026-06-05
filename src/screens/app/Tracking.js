import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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

export default function Tracking({ navigation, route }) {
  const { modalidade, modalidadeId, usaGps } = route.params || { modalidade: 'Treino', usaGps: true };
  const { isDark } = useContext(ThemeContext);

  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [distanciaKm, setDistanciaKm] = useState(0);
  const [pesoPerfil, setPesoPerfil] = useState(70);
  const locationSubRef = useRef(null);

  const C = {
    bg:     isDark ? '#0B1120' : '#F8FAFC',
    card:   isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.97)',
    text:   isDark ? '#F1F5F9' : '#0F172A',
    sub:    isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    danger: '#EF4444',
    border: isDark ? '#334155' : '#E2E8F0',
  };

  const getMET = () => {
    if (modalidade === 'Corrida') return 8.0;
    if (modalidade === 'Ciclismo') return 6.8;
    return 5.0;
  };

  const horas = tempo / 3600;
  const caloriasTotais = Math.round(getMET() * pesoPerfil * horas);
  const tempoMinutos = Math.floor(tempo / 60);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('perfis').select('peso_kg').eq('id', user.id).single();
      if (data?.peso_kg) setPesoPerfil(data.peso_kg);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(loc.coords);
      }
    })();
    return () => { locationSubRef.current?.remove(); };
  }, []);

  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => setTempo(prev => prev + 1), 1000);

      if (usaGps) {
        (async () => {
          const sub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 5 },
            (newLoc) => {
              const coords = newLoc.coords;
              setLocation(coords);
              setRouteCoords(prev => {
                if (prev.length > 0) {
                  const segmento = haversineKm(prev[prev.length - 1], coords);
                  if (segmento < 0.05) {
                    setDistanciaKm(d => d + segmento);
                  }
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
  }, [isTracking]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const salvarTreino = async () => {
    if (tempoMinutos < 1) {
      Alert.alert('Treino muito curto', 'Grave pelo menos 1 minuto de atividade.');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { error } = await supabase.from('treinos').insert({
        perfil_id:       user.id,
        modalidade_id:   modalidadeId || null,
        modalidade:      modalidade,
        distancia_km:    parseFloat(distanciaKm.toFixed(2)),
        duracao_minutos: tempoMinutos,
        calorias:        caloriasTotais > 0 ? caloriasTotais : 1,
      });
      if (error) throw error;

      Alert.alert('✅ Treino salvo!', `${tempoMinutos} min · ${distanciaKm.toFixed(2)} km · ${caloriasTotais} kcal`, [
        { text: 'OK', onPress: () => navigation.replace('MainTabs') }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar: ' + error.message);
    }
  };

  const pausarOuIniciar = () => {
    if (isTracking) {
      setIsTracking(false);
      Alert.alert('Treino Pausado', 'O que deseja fazer?', [
        { text: 'Continuar Treino', onPress: () => setIsTracking(true) },
        { text: 'Encerrar e Salvar', onPress: salvarTreino },
        { text: 'Descartar', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      setIsTracking(true);
    }
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation
          followsUserLocation={isTracking}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
        >
          {usaGps && routeCoords.length > 1 && (
            <Polyline coordinates={routeCoords} strokeColor={C.accent} strokeWidth={5} lineCap="round" />
          )}
        </MapView>
      ) : (
        <View style={[styles.loadingMap, { backgroundColor: C.bg }]}>
          <MaterialCommunityIcons name="satellite-uplink" size={40} color={C.sub} />
          <Text style={{ color: C.sub, marginTop: 12, fontWeight: '600' }}>Buscando sinal GPS...</Text>
        </View>
      )}

      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: C.card }]} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={[styles.modalidadeBadge, { backgroundColor: C.card }]}>
          <MaterialCommunityIcons
            name={modalidade === 'Ciclismo' ? 'bike' : modalidade === 'Natação' ? 'swim' : 'run'}
            size={16} color={C.accent}
          />
          <Text style={[styles.modalidadeText, { color: C.text }]}>{modalidade}</Text>
        </View>
      </SafeAreaView>

      <View style={styles.panelWrap}>
        <View style={[styles.panel, { backgroundColor: C.card }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isTracking ? C.accent : C.sub }]} />
            <Text style={[styles.statusText, { color: C.sub }]}>
              {isTracking ? 'Gravando atividade...' : tempo > 0 ? 'Pausado' : 'Pronto para iniciar'}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: C.text }]}>{formatTime(tempo)}</Text>
              <Text style={[styles.statLabel, { color: C.sub }]}>Tempo</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            {usaGps ? (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: C.text }]}>{distanciaKm.toFixed(2)}</Text>
                <Text style={[styles.statLabel, { color: C.sub }]}>Km</Text>
              </View>
            ) : (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: C.text }]}>{tempoMinutos}</Text>
                <Text style={[styles.statLabel, { color: C.sub }]}>Min</Text>
              </View>
            )}
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: C.text }]}>{caloriasTotais}</Text>
              <Text style={[styles.statLabel, { color: C.sub }]}>Kcal</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isTracking ? C.danger : C.accent }]}
            onPress={pausarOuIniciar}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name={isTracking ? 'pause' : 'play'} size={28} color="#FFF" />
            <Text style={styles.actionBtnText}>
              {isTracking ? 'PAUSAR' : tempo > 0 ? 'RETOMAR' : 'INICIAR'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingMap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { position: 'absolute', top: 10, left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 },
  modalidadeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, elevation: 4 },
  modalidadeText: { fontSize: 14, fontWeight: '700' },
  panelWrap: { position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 10 },
  panel: { borderRadius: 28, padding: 22, elevation: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36 },
  actionBtn: { flexDirection: 'row', height: 62, borderRadius: 22, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 4 },
  actionBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});