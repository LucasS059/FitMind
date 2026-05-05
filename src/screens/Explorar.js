import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../services/supabase';
import { ThemeContext } from '../contexts/ThemeContext'; // Usando o tema global!

export default function Explorar() {
  const { isDark } = useContext(ThemeContext);
  
  const [locais, setLocais] = useState([]);
  const [minhaLocalizacao, setMinhaLocalizacao] = useState(null);
  const [loading, setLoading] = useState(true);

  const theme = {
    bg: isDark ? '#0B1120' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    subtext: isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    border: isDark ? '#334155' : '#E2E8F0'
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

        const { data, error } = await supabase.from('locais').select('*');
        if (error) throw error;

        const locaisComDistancia = data.map(local => ({
          ...local,
          distancia: status === 'granted' ? calcularDistancia(userLat, userLng, local.latitude, local.longitude) : '?'
        })).sort((a, b) => a.distancia - b.distancia);

        setLocais(locaisComDistancia);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Encontre Locais</Text>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.subtext, marginTop: 10 }}>Buscando locais e seu GPS...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          
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
              {locais.map(local => (
                <Marker key={local.id} coordinate={{ latitude: parseFloat(local.latitude), longitude: parseFloat(local.longitude) }} title={local.nome} description={local.tipo} />
              ))}
            </MapView>
          </View>

          <View style={{ paddingHorizontal: 24 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Mais Próximos de Você</Text>
            
            {locais.map((local) => (
              <TouchableOpacity 
                key={local.id} 
                style={[styles.placeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => abrirRotaNoNativo(local.latitude, local.longitude, local.nome)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  mapContainer: { height: 250, marginHorizontal: 24, borderRadius: 24, overflow: 'hidden', marginBottom: 24, elevation: 4 },
  map: { flex: 1 },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  placeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  placeIconArea: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  placeCity: { fontSize: 13, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badgeContainer: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  distText: { fontSize: 12, fontWeight: '600' },
  
  routeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});