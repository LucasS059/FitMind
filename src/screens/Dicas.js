import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av'; // NOVO IMPORT DO EXPO-AV

export default function Dicas({ route, navigation }) {
  const { atividade } = route.params;

  // Dicionário com os caminhos dos vídeos locais.
  const videoSources = {
    'Futebol': require('../../assets/videos/futebol.mp4'),
    'Basquete': require('../../assets/videos/basquete.mp4'),
    'Tênis': require('../../assets/videos/tenis.mp4'),
    'Caminhada': require('../../assets/videos/caminhada.mp4'),
    'Ciclismo': require('../../assets/videos/ciclismo.mp4'),
    'Corrida': require('../../assets/videos/corrida.mp4'),
  };

  // Puxa o arquivo de vídeo correspondente ao esporte aberto
  const videoSelecionado = videoSources[atividade.nome];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{atividade.nome}</Text>
      <Text style={styles.subtitle}>Guia de preparação e execução</Text>

      {/* NOVO SISTEMA DE VÍDEO NATIVO (LOOP E MUDO) */}
      {videoSelecionado ? (
        <View style={styles.videoContainer}>
          <Video
            source={videoSelecionado}
            style={{ width: '100%', height: 200 }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={true} // Autoplay
            isLooping={true}  // Repete infinitamente
            isMuted={true}    // Força ficar sem som, deixando o app mais leve
            useNativeControls 
          />
        </View>
      ) : (
        <View style={styles.videoPlaceholder}>
          <MaterialCommunityIcons name="play-circle" size={64} color="#10B981" />
          <Text style={styles.videoText}>Vídeo demonstrativo em breve</Text>
        </View>
      )}

      {/* SEÇÃO: ALONGAMENTO */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="human-stretch" size={24} color="#10B981" />
          <Text style={styles.sectionTitle}>1. Alongamento Recomendado</Text>
        </View>
        <Text style={styles.sectionBody}>{atividade.alongamento}</Text>
      </View>

      {/* SEÇÃO: AQUECIMENTO */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="fire" size={24} color="#10B981" />
          <Text style={styles.sectionTitle}>2. Aquecimento Prévio</Text>
        </View>
        <Text style={styles.sectionBody}>{atividade.aquecimento}</Text>
      </View>

      {/* SEÇÃO: COMO PRATICAR */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="dumbbell" size={24} color="#10B981" />
          <Text style={styles.sectionTitle}>3. Como Praticar com Segurança</Text>
        </View>
        <Text style={styles.sectionBody}>{atividade.comoPraticar}</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 24, paddingTop: 60 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButtonText: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginLeft: 8 },
  title: { fontSize: 32, fontWeight: '900', color: '#1E293B' },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 24, marginTop: 4 },
  
  videoContainer: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, elevation: 4, backgroundColor: '#000' },
  videoPlaceholder: { backgroundColor: '#1E293B', height: 200, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  videoText: { color: '#94A3B8', marginTop: 8, fontSize: 14, fontWeight: '500' },
  
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginLeft: 10 },
  sectionBody: { fontSize: 15, color: '#475569', lineHeight: 22 },
});