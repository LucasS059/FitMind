import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function GuiasList({ route, navigation }) {
  const { colors } = useContext(ThemeContext);
  const { modalidade } = route.params; 
  
  const [dicas, setDicas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDicasDaModalidade() {
      try {
        const { data, error } = await supabase
          .from('dicas')
          .select('*')
          .eq('modalidade_id', modalidade.id)
          .order('criado_em', { ascending: false });
          
        if (error) throw error;
        setDicas(data || []);
      } catch (error) {
        console.log('Erro ao buscar dicas:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDicasDaModalidade();
  }, [modalidade.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerLoading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={[styles.backIconBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </View>
          <Text style={[styles.backButtonText, { color: colors.text }]}>Voltar</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>{modalidade.nome}</Text>
        <Text style={[styles.subtitle, { color: colors.sub }]}>Selecione um tópico de estudo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {dicas.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="information-outline" size={32} color={colors.sub} />
            <Text style={[styles.emptyText, { color: colors.sub }]}>Nenhum guia disponível para {modalidade.nome} ainda.</Text>
          </View>
        ) : (
          dicas.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('GuiaDetalhe', { atividade: { ...item, nome_esporte: modalidade.nome } })}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.accent + '20' }]}>
                <MaterialCommunityIcons name="play" size={28} color={colors.accent} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.titulo}</Text>
                <Text style={[styles.cardSub, { color: colors.sub }]} numberOfLines={2}>
                  {item.subtitulo}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backIconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 4 },
  content: { padding: 20, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 13, lineHeight: 18 },
  emptyBox: { padding: 32, alignItems: 'center', borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', marginTop: 20 },
  emptyText: { marginTop: 12, textAlign: 'center', fontSize: 15 },
});