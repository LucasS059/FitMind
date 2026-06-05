import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function History({ navigation, route }) {
  const { isDark, colors } = useContext(ThemeContext);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [treinoAtivo, setTreinoAtivo] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.treino) {
        setTreinoAtivo(route.params.treino);
      } else {
        setTreinoAtivo(null);
        fetchHistorico();
      }
      return () => {
        navigation.setParams({ treino: null });
        setTreinoAtivo(null);
      };
    }, [route.params?.treino])
  );

  const fetchHistorico = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('treinos')
      .select('*, modalidade:modalidades(nome, icone)')
      .eq('perfil_id', user.id)
      .order('data_treino', { ascending: false });
    setHistorico(data || []);
    setLoading(false);
  };

  const formatPace = (minutos, km) => {
    if (!km || km <= 0) return '0:00';
    const paceDecimal = minutos / km;
    const paceMinutes = Math.floor(paceDecimal);
    const paceSeconds = Math.round((paceDecimal - paceMinutes) * 60);
    return `${paceMinutes}:${paceSeconds < 10 ? '0' : ''}${paceSeconds}`;
  };

  const renderItem = ({ item }) => {
    const pace = formatPace(item.duracao_minutos, item.distancia_km);
    const date = new Date(item.data_treino).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
      <TouchableOpacity
        style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setTreinoAtivo(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2A2A38' : '#F4F4F5' }]}>
              <MaterialCommunityIcons name={item.modalidade?.icone || 'run'} size={24} color={colors.accent} />
            </View>
            <View style={styles.historyInfo}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>{item.modalidade?.nome || 'Atividade'}</Text>
              <Text style={[styles.historyDate, { color: colors.sub }]}>{date}</Text>
            </View>
          </View>
          <View style={styles.chevronBox}>
             <MaterialCommunityIcons name="chevron-right" size={20} color={colors.sub} />
          </View>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

        <View style={styles.historyStatsRow}>
          <View style={styles.statMiniBox}>
            <Text style={[styles.statMiniVal, { color: colors.text }]}>{item.distancia_km}</Text>
            <Text style={[styles.statMiniLabel, { color: colors.sub }]}>km</Text>
          </View>
          <View style={styles.statMiniBox}>
            <Text style={[styles.statMiniVal, { color: colors.text }]}>{item.duracao_minutos}</Text>
            <Text style={[styles.statMiniLabel, { color: colors.sub }]}>min</Text>
          </View>
          <View style={styles.statMiniBox}>
            <Text style={[styles.statMiniVal, { color: colors.text }]}>{item.calorias}</Text>
            <Text style={[styles.statMiniLabel, { color: colors.sub }]}>kcal</Text>
          </View>
          <View style={styles.statMiniBox}>
            <Text style={[styles.statMiniVal, { color: colors.text }]}>{pace}</Text>
            <Text style={[styles.statMiniLabel, { color: colors.sub }]}>/km</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!treinoAtivo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.listHeader}>
          <Text style={[styles.listEyebrow, { color: colors.accent }]}>A SUA JORNADA</Text>
          <Text style={[styles.listTitle, { color: colors.text }]}>Histórico de Treinos</Text>
        </View>
        
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={historico}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
                <MaterialCommunityIcons name="folder-open-outline" size={48} color={colors.sub} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum treino encontrado</Text>
                <Text style={[styles.emptyText, { color: colors.sub }]}>Os seus treinos gravados aparecerão aqui.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  const t = treinoAtivo;
  const ritmoFormatado = formatPace(t.duracao_minutos, t.distancia_km);
  
  let velocidadeMedia = '0.0';
  if (t?.distancia_km > 0 && t?.duracao_minutos > 0) {
    const tempoEmHoras = t.duracao_minutos / 60;
    velocidadeMedia = (t.distancia_km / tempoEmHoras).toFixed(1);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => setTreinoAtivo(null)} style={[styles.backButton, { backgroundColor: isDark ? '#2A2A38' : '#F4F4F5' }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: colors.text }]}>Detalhes do Treino</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIconBox, { backgroundColor: isDark ? '#2A2A38' : '#F4F4F5' }]}>
             <MaterialCommunityIcons name={t.modalidade?.icone || 'run'} size={32} color={colors.accent} />
          </View>
          <Text style={[styles.activityName, { color: colors.text }]}>{t.modalidade?.nome || 'Atividade'}</Text>
          <Text style={[styles.activityDate, { color: colors.sub }]}>
            {new Date(t.data_treino).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>

          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>{t.distancia_km}</Text>
              <Text style={[styles.statLabel, { color: colors.sub }]}>Distância (km)</Text>
            </View>
            <View style={[styles.vertDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>{t.duracao_minutos}</Text>
              <Text style={[styles.statLabel, { color: colors.sub }]}>Tempo (min)</Text>
            </View>
            <View style={[styles.vertDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.text }]}>{t.calorias}</Text>
              <Text style={[styles.statLabel, { color: colors.sub }]}>Calorias</Text>
            </View>
          </View>
        </View>

        {t.rota?.length > 0 && (
          <View style={styles.mapWrapper}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Rota</Text>
            <View style={[styles.mapContainer, { borderColor: colors.border }]}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: t.rota[0].latitude,
                  longitude: t.rota[0].longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                pitchEnabled={false}
              >
                <Polyline coordinates={t.rota} strokeColor={colors.accent} strokeWidth={5} lineCap="round" lineJoin="round" />
                <Marker coordinate={t.rota[0]}>
                  <View style={styles.mapPinStart} />
                </Marker>
                <Marker coordinate={t.rota[t.rota.length - 1]}>
                  <View style={styles.mapPinEnd} />
                </Marker>
              </MapView>
            </View>
          </View>
        )}

        <View style={styles.metricsWrapper}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Desempenho</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={[styles.infoIconBox, { backgroundColor: '#3B82F620' }]}>
                  <MaterialCommunityIcons name="speedometer" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.infoLabel, { color: colors.sub }]}>Velocidade Média</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>{velocidadeMedia} <Text style={{fontSize: 14}}>km/h</Text></Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={[styles.infoIconBox, { backgroundColor: '#10B98120' }]}>
                  <MaterialCommunityIcons name="timer-outline" size={20} color="#10B981" />
                </View>
                <Text style={[styles.infoLabel, { color: colors.sub }]}>Ritmo Médio</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>{ritmoFormatado} <Text style={{fontSize: 14}}>min/km</Text></Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={[styles.infoIconBox, { backgroundColor: '#F59E0B20' }]}>
                  <MaterialCommunityIcons name="clock-fast" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.infoLabel, { color: colors.sub }]}>Tempo Total</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>{t.duracao_minutos} <Text style={{fontSize: 14}}>min</Text></Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={[styles.infoIconBox, { backgroundColor: '#EF444420' }]}>
                  <MaterialCommunityIcons name="fire" size={20} color="#EF4444" />
                </View>
                <Text style={[styles.infoLabel, { color: colors.sub }]}>Calorias Gastas</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>{t.calorias} <Text style={{fontSize: 14}}>kcal</Text></Text>
            </View>

          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // -- List Header --
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  
  // -- List Container --
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
  },

  // -- History Cards --
  historyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  historyInfo: {
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chevronBox: {
    padding: 4,
  },
  cardDivider: {
    height: 1,
    marginVertical: 14,
    opacity: 0.5,
  },
  historyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statMiniBox: {
    alignItems: 'flex-start',
  },
  statMiniVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  statMiniLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  // -- Details View --
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  
  // -- Hero Card --
  heroCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityName: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  activityDate: {
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  heroDivider: {
    width: '100%',
    height: 1,
    marginVertical: 20,
    opacity: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  vertDivider: {
    width: 1,
    height: 30,
    opacity: 0.5,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // -- Sections --
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 4,
  },
  mapWrapper: {
    marginBottom: 24,
  },
  mapContainer: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: {
    flex: 1,
  },
  mapPinStart: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  mapPinEnd: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  // -- Performance Metrics --
  metricsWrapper: {
    marginBottom: 20,
  },
  infoCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
    opacity: 0.5,
  },
});