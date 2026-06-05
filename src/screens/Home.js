import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  ActivityIndicator, TouchableOpacity, 
  ScrollView, StatusBar, useColorScheme 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

// 1. ADICIONADO A PROPRIEDADE navigation AQUI
export default function Home({ navigation }) {
  const deviceTheme = useColorScheme();
  const [isDark, setIsDark] = useState(deviceTheme === 'dark');
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = {
    bg: isDark ? '#0F172A' : '#F1F5F9',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#1E293B',
    subtext: isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    border: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
  };

// Criamos a lista de botões direto no código
  useEffect(() => {
    const listaFixa = [
      { id: '1', nome: 'Futebol', icone: 'soccer' },
      { id: '2', nome: 'Basquete', icone: 'basketball' },
      { id: '3', nome: 'Tênis', icone: 'tennis' },
      { id: '4', nome: 'Caminhada', icone: 'walk' },
      { id: '5', nome: 'Ciclismo', icone: 'bike' },
      { id: '6', nome: 'Corrida', icone: 'run' }
    ];
    
    setLista(listaFixa);
    setLoading(false);
  }, []);
  
  // 2. ADICIONADO O EVENTO onPress PARA NAVEGAR PASSANDO O 'item'
  const renderSportItem = ({ item }) => (
      <TouchableOpacity 
        style={[styles.sportItem, { backgroundColor: theme.card }]}
        onPress={() => {
          // Puxa as dicas do nosso dicionário lá de cima usando o nome do esporte
          const dicasDoEsporte = DICAS_ESPORTES[item.nome] || {};

          const atividadeCompleta = {
            ...item,
            alongamento: dicasDoEsporte.alongamento || 'Dica de alongamento em breve.',
            aquecimento: dicasDoEsporte.aquecimento || 'Dica de aquecimento em breve.',
            comoPraticar: dicasDoEsporte.comoPraticar || 'Dicas de prática em breve.'
          };

          navigation.navigate('Inicio', {
            screen: 'AtividadeDetalhes',
            params: { atividade: atividadeCompleta }
          });
        }}
      >
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={item.icone?.toLowerCase() || 'run'} size={24} color={theme.accent} />
        </View>
        <Text style={[styles.sportLabel, { color: theme.text }]}>{item.nome}</Text>
      </TouchableOpacity>
    );
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* Header Minimalista */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: theme.subtext }]}>Bora treinar,</Text>
              <Text style={[styles.userName, { color: theme.text }]}>Lucas Barboza</Text>
            </View>
            <TouchableOpacity onPress={() => setIsDark(!isDark)} style={[styles.themeBtn, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name={isDark ? 'weather-sunny' : 'weather-night'} size={22} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {/* Widgets de Performance */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name="fire" size={20} color="#EF4444" />
              <Text style={[styles.statValue, { color: theme.text }]}>450</Text>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>kcal</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name="walk" size={20} color={theme.accent} />
              <Text style={[styles.statValue, { color: theme.text }]}>8.4k</Text>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>passos</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#3B82F6" />
              <Text style={[styles.statValue, { color: theme.text }]}>32m</Text>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>atividade</Text>
            </View>
          </View>

          {/* Seção Horizontal de Modalidades */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Escolha um esporte</Text>
            {loading ? (
              <ActivityIndicator color={theme.accent} />
            ) : (
              <FlatList
                horizontal
                data={lista}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSportItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            )}
          </View>

          {/* Card de "Próximo Passo" - Localização */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Lugares perto de você</Text>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.accent }]}>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Quadra de Tênis - Mauá</Text>
                <Text style={styles.actionSub}>A 1.2km de distância</Text>
              </View>
              <MaterialCommunityIcons name="map-marker-distance" size={32} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, marginTop: 12, borderWidth: 1, borderColor: theme.border }]}>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: theme.text }]}>Parque Celso Daniel</Text>
                <Text style={[styles.actionSub, { color: theme.subtext }]}>Ideal para Ciclismo e Corrida</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={28} color={theme.subtext} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Dicionário local com todas as dicas dos esportes
const DICAS_ESPORTES = {
  'Futebol': {
    alongamento: 'Foque nos membros inferiores: isquiotibiais, quadríceps, panturrilhas e virilha. Mantenha cada posição por 30 segundos.',
    aquecimento: '5 a 10 minutos de trote leve, seguidos de deslocamentos laterais, elevação de joelhos (skipping) e pequenos sprints.',
    comoPraticar: 'Mantenha a cabeça erguida para ter visão de jogo. Use calçados adequados (chuteira com travas para campo, lisa para quadra) e hidrate-se frequentemente.'
  },
  'Basquete': {
    alongamento: 'Alongue bem os ombros, tríceps, região lombar e panturrilhas, preparando o corpo para os saltos e impactos contínuos.',
    aquecimento: 'Corrida leve, polichinelos, deslocamentos defensivos laterais e simulação de arremessos e rebotes sem a bola por 5 a 8 minutos.',
    comoPraticar: 'Flexione os joelhos e mantenha o centro de gravidade baixo na defesa. Ao arremessar, use o movimento das pernas para impulsionar a bola, e não apenas os braços.'
  },
  'Tênis': {
    alongamento: 'Alongamento dinâmico para os punhos, antebraços, manguito rotador (ombros) e rotação de tronco.',
    aquecimento: 'Corridas curtas de frente e de costas na linha de fundo, agachamentos leves e rotações de braço para aquecer as articulações superiores.',
    comoPraticar: 'Acompanhe o movimento da raquete até o final. Flexione os joelhos para buscar bolas baixas em vez de curvar as costas, e mantenha os olhos sempre na bola.'
  },
  'Caminhada': {
    alongamento: 'Foque nas panturrilhas, coxas e lombar. Faça rotações leves nos tornozelos para evitar torções em terrenos irregulares.',
    aquecimento: 'Comece com 5 minutos de caminhada em ritmo bem lento para soltar as articulações antes de acelerar para o seu ritmo ideal de treino.',
    comoPraticar: 'Mantenha a postura ereta, olhe para frente (não para o chão) e balance os braços no ritmo da passada. Use um tênis com bom amortecimento para evitar impacto nos joelhos.'
  },
  'Ciclismo': {
    alongamento: 'Alongue quadríceps, lombar, pescoço e punhos. A posição curvada na bicicleta exige muito da coluna e dos braços ao segurar o guidão.',
    aquecimento: 'Pedale em uma marcha leve (sem fazer força) e em terreno plano nos primeiros 10 minutos para lubrificar as articulações dos joelhos.',
    comoPraticar: 'Ajuste a altura do selim (banco) para que a perna fique quase totalmente esticada no ponto mais baixo do pedal. Mantenha os cotovelos levemente flexionados para absorver os impactos do asfalto.'
  },
  'Corrida': {
    alongamento: 'Antes do treino, prefira alongamentos dinâmicos (em movimento). Guarde os alongamentos estáticos (puxar e segurar) para os glúteos e panturrilhas após o treino.',
    aquecimento: '5 a 10 minutos de caminhada rápida. Faça exercícios educativos como "skipping" (elevação de joelhos) e "calcanhar no glúteo" para ativar a musculatura.',
    comoPraticar: 'Pouse o pé no chão com a parte média (não bata o calcanhar com força). Respire em um ritmo constante e relaxe os ombros.'
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  greeting: { fontSize: 14, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800' },
  themeBtn: { padding: 10, borderRadius: 12, elevation: 1 },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 30 },
  statCard: { width: '30%', padding: 15, borderRadius: 20, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 5 },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 24, marginBottom: 15 },
  horizontalList: { paddingHorizontal: 24 },
  
  sportItem: { alignItems: 'center', marginRight: 15, padding: 15, borderRadius: 20, width: 90, elevation: 2 },
  iconCircle: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 50, marginBottom: 8 },
  sportLabel: { fontSize: 12, fontWeight: '700' },

  actionCard: { flexDirection: 'row', marginHorizontal: 24, padding: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between', elevation: 3 },
  actionInfo: { flex: 1 },
  actionTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  actionSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }
});