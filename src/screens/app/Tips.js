import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ThemeContext } from '../../contexts/ThemeContext'; // Ajuste o caminho se necessário

export default function Dicas({ route, navigation }) {
  const { isDark, colors } = useContext(ThemeContext);

  // Recebe os dados da navegação ou usa valores padrão
  const atividade = route?.params?.atividade || {
    nome: 'Atividade',
    alongamento: 'Nenhuma instrução de alongamento disponível no momento.',
    aquecimento: 'Nenhuma instrução de aquecimento disponível no momento.',
    comoPraticar: 'Informações sobre a prática serão adicionadas em breve.',
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const match = String(url).match(/(?:v=|\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
    return match ? match[1] : null;
  };

  const videoSelecionado = getYoutubeId(atividade.youtube_url);
  const comoPraticar = atividade.comoPraticar || atividade.como_praticar || atividade.comoPraticarFallback;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Botão de Voltar */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={[styles.backIconBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </View>
          <Text style={[styles.backButtonText, { color: colors.text }]}>Voltar</Text>
        </TouchableOpacity>

        {/* Cabeçalho */}
        <Text style={[styles.title, { color: colors.text }]}>{atividade.nome}</Text>
        <Text style={[styles.subtitle, { color: colors.sub }]}>Guia de preparação e execução</Text>

        {/* SISTEMA DE VÍDEO INTELIGENTE */}
        {videoSelecionado ? (
          <View style={[styles.videoContainer, { borderColor: colors.border }]}>
            <YoutubePlayer
              height={200}
              play={false}
              videoId={videoSelecionado}
              webViewStyle={{ opacity: 0.99 }} // Evita bugs de renderização no Android
            />
          </View>
        ) : (
          <View style={[styles.videoPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="youtube" size={48} color={colors.sub} style={{ opacity: 0.5 }} />
            <Text style={[styles.videoText, { color: colors.sub }]}>Vídeo demonstrativo indisponível</Text>
          </View>
        )}

        {/* SEÇÃO: ALONGAMENTO */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.accent + '20' }]}>
              <MaterialCommunityIcons name="human-stretch" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Alongamento Recomendado</Text>
          </View>
          <Text style={[styles.sectionBody, { color: colors.text }]}>{atividade.alongamento}</Text>
        </View>

        {/* SEÇÃO: AQUECIMENTO */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#F59E0B20' }]}>
              <MaterialCommunityIcons name="fire" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Aquecimento Prévio</Text>
          </View>
          <Text style={[styles.sectionBody, { color: colors.text }]}>{atividade.aquecimento}</Text>
        </View>

        {/* SEÇÃO: COMO PRATICAR */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#3B82F620' }]}>
              <MaterialCommunityIcons name="dumbbell" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Como Praticar com Segurança</Text>
          </View>
          <Text style={[styles.sectionBody, { color: colors.text }]}>{comoPraticar}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  
  // Header e Navegação
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backIconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginBottom: 24, marginTop: 4 },
  
  // Player de Vídeo
  videoContainer: { borderRadius: 20, overflow: 'hidden', marginBottom: 24, borderWidth: 1, backgroundColor: '#000' },
  videoPlaceholder: { height: 200, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderStyle: 'dashed' },
  videoText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
  
  // Cards de Conteúdo
  sectionCard: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginLeft: 12 },
  sectionBody: { fontSize: 15, lineHeight: 24, opacity: 0.9 },
});