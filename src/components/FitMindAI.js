import React, { useState, useContext } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, 
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { ThemeContext } from '../contexts/ThemeContext';

export default function FitMindAI({ visible, onClose, nome, stats, historico, creditosIA, onUpdateCreditos }) {
  const { isDark } = useContext(ThemeContext);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const C = {
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    sub: isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    aiPurple: isDark ? '#6366F1' : '#4F46E5',
    border: isDark ? '#334155' : '#E2E8F0',
    divider: isDark ? '#334155' : '#F1F5F9'
  };

  const handleAIQuery = async () => {
  if (!aiPrompt.trim() || creditosIA <= 0) return;
  
  setAiLoading(true);
  setAiResponse('');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const contextoTreinos = historico.map(t => 
      `- ${t.modalidade}: ${t.distancia_km}km, ${t.calorias}kcal em ${t.data_treino}`
    ).join('\n');

    const promptCompleto = `
      Você é o FitMind AI, especialista em performance física. 
      Analise os dados de ${nome}: ${stats.qtd} treinos, ${stats.km}km totais, ${stats.kcal}kcal gastas.
      Histórico recente: ${contextoTreinos}.
      Pergunta do usuário: "${aiPrompt}".
      Responda de forma curta e profissional.
    `;

    const { data, error } = await supabase.functions.invoke('chat-ia', { 
      body: { prompt: promptCompleto } 
    });

    if (error) {
       if (error.message?.includes('503') || error.message?.includes('unavailable')) {
         Alert.alert('Servidor Ocupado', 'A IA está com muito tráfego agora. Tente novamente em alguns segundos.');
       } else {
         throw error;
       }
       return;
    }

    const { data: updatedPerfil, error: updateError } = await supabase
      .from('perfis')
      .update({ ia_creditos: creditosIA - 1 })
      .eq('id', user.id)
      .select('ia_creditos') 
      .single();

    if (updateError) throw updateError;

    setAiResponse(data.resposta);
    onUpdateCreditos(updatedPerfil.ia_creditos);
    setAiPrompt('');
  } catch (error) {
    console.error("Erro na execução:", error);
    Alert.alert('Erro', 'Ocorreu um problema ao processar sua consulta.');
  } finally {
    setAiLoading(false);
  }
};

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: C.card }]}>
          
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="brain" size={20} color={C.aiPurple} />
              <Text style={[styles.modalTitle, { color: C.text }]}>FitMind AI</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={20} color={C.sub} />
            </TouchableOpacity>
          </View>

          <View style={[styles.creditBanner, { backgroundColor: isDark ? '#0B1120' : '#F1F5F9' }]}>
            <Text style={[styles.creditText, { color: C.text }]}>
              Consultas restantes: <Text style={{fontWeight: 'bold', color: C.aiPurple}}>{creditosIA}</Text> / 5
            </Text>
          </View>

          <ScrollView style={styles.chatScroll} showsVerticalScrollIndicator={false}>
            {aiLoading ? (
              <View style={styles.aiLoadingState}>
                <ActivityIndicator size="small" color={C.aiPurple} />
                <Text style={[styles.aiLoadingText, { color: C.sub }]}>Analisando métricas...</Text>
              </View>
            ) : aiResponse ? (
              <View style={[styles.responseCard, { backgroundColor: isDark ? '#0B1120' : '#F8FAFC', borderColor: C.border }]}>
                <Text style={[styles.responseText, { color: C.text }]}>{aiResponse}</Text>
              </View>
            ) : (
              <View style={styles.promptHelperBox}>
                <Text style={[styles.helperTitle, { color: C.text }]}>Sugestões:</Text>
                <TouchableOpacity onPress={() => setAiPrompt("Avalie minha consistência de treinos.")} style={[styles.helperChip, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                  <Text style={[styles.helperChipText, { color: C.text }]}>Avalie minha consistência de treinos</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInputField, { backgroundColor: isDark ? '#0B1120' : '#F8FAFC', color: C.text, borderColor: C.border }]}
              placeholder={creditosIA > 0 ? "Como posso ajudar?" : "Créditos esgotados"}
              placeholderTextColor={C.sub}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              editable={!aiLoading && creditosIA > 0}
            />
            <TouchableOpacity 
              style={[styles.sendIconField, { backgroundColor: aiPrompt.trim() && !aiLoading && creditosIA > 0 ? C.aiPurple : C.divider }]}
              onPress={handleAIQuery}
              disabled={!aiPrompt.trim() || aiLoading || creditosIA <= 0}
            >
              <MaterialCommunityIcons name="arrow-up" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '65%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  closeButton: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  chatScroll: { flex: 1 },
  aiLoadingState: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 40 },
  aiLoadingText: { fontSize: 13, fontWeight: '500' },
  responseCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  responseText: { fontSize: 14, lineHeight: 22 },
  promptHelperBox: { marginTop: 20, gap: 8 },
  helperTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  helperChip: { padding: 12, borderRadius: 12 },
  helperChipText: { fontSize: 13, fontWeight: '500' },
  creditBanner: { padding: 10, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  creditText: { fontSize: 12, fontWeight: '500' },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 14, marginBottom: Platform.OS === 'ios' ? 10 : 0 },
  textInputField: { flex: 1, height: 46, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, fontSize: 14 },
  sendIconField: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});