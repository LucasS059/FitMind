import React, { useState, useContext, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, Pressable, TextInput, ActivityIndicator,
  FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { ThemeContext } from '../contexts/ThemeContext';

export default function Home({ navigation }) {
  const { isDark } = useContext(ThemeContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [pergunta, setPergunta] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [creditosIA, setCreditosIA] = useState(null); 
  const [mensagensChat, setMensagensChat] = useState([
    { id: '1', role: 'ai', text: 'Fala, atleta! 💪 Como posso ajudar no seu foco hoje?' }
  ]);
  const [modalidades, setModalidades] = useState([]);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [historicoTreinos, setHistoricoTreinos] = useState([]);
  const [resumoSemana, setResumoSemana] = useState({ qtd: 0, kcal: 0, km: 0 });
  const [dicas, setDicas] = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const flatListRef = useRef(null);

  const C = {
    bg:         isDark ? '#0B1120' : '#F8FAFC',
    card:       isDark ? '#1E293B' : '#FFFFFF',
    cardAlt:    isDark ? '#162032' : '#F1F5F9',
    text:       isDark ? '#F1F5F9' : '#0F172A',
    subtext:    isDark ? '#94A3B8' : '#64748B',
    accent:     '#10B981',
    accentDim:  isDark ? 'rgba(16,185,129,0.12)' : '#D1FAE5',
    accentMid:  'rgba(16,185,129,0.25)',
    blue:       '#3B82F6',
    blueDim:    'rgba(59,130,246,0.15)',
    border:     isDark ? '#1E3A52' : '#E2E8F0',
    heroBg:     isDark ? '#0F2035' : '#EFF6FF',
    chatAiBg:   isDark ? '#1A2E4A' : '#EFF6FF',
    chatAiText: isDark ? '#E0F2FE' : '#1E3A8A',
  };

  const buscarDadosDoUsuario = async () => {
    try {
      setLoadingDados(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome, ia_creditos')
        .eq('id', user.id)
        .single();

      if (perfil) {
        setNomeUsuario(perfil.nome.split(' ')[0]);
        setCreditosIA(perfil.ia_creditos);
      }

      const { data: treinos } = await supabase
        .from('treinos')
        .select('*')
        .eq('perfil_id', user.id)
        .order('data_treino', { ascending: false });

      const { data: dicasDB } = await supabase
        .from('dicas')
        .select('*')
        .order('criado_em', { ascending: false });

      if (dicasDB) setDicas(dicasDB);

      const hoje = new Date();
      const inicioDaSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
      inicioDaSemana.setHours(0, 0, 0, 0);

      let [kcal, km, qtd] = [0, 0, 0];
      if (treinos) {
        treinos.forEach(t => {
          if (new Date(t.data_treino) >= inicioDaSemana) {
            kcal += t.calorias || 0;
            km += parseFloat(t.distancia_km || 0);
            qtd++;
          }
        });
        setResumoSemana({ qtd, kcal, km: km.toFixed(1) });
        setHistoricoTreinos(treinos.slice(0, 5));
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error.message);
    } finally {
      setLoadingDados(false);
    }
  };

 const buscarModalidades = async () => {
    try {
      const { data } = await supabase
        .from('modalidades')
        .select('id, nome, icone, usa_gps')
        .eq('usa_gps', true)
        .order('nome');
        
      if (data) setModalidades(data);
    } catch (error) {
      console.error('Erro ao buscar modalidades:', error.message);
    }
  };

  useFocusEffect(React.useCallback(() => {
    buscarDadosDoUsuario();
    buscarModalidades();
  }, []));

  const perguntarParaIA = async () => {
    if (!pergunta.trim()) return;

    const novaMensagemUsuario = { id: Date.now().toString(), role: 'user', text: pergunta };
    setMensagensChat(prev => [...prev, novaMensagemUsuario]);
    const textoEnviado = pergunta;
    setPergunta('');
    setLoadingIA(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-ia', {
        body: { pergunta: textoEnviado }
      });

      if (error || data?.error) throw new Error(error?.message || data.error);

      const novaMensagemIA = { id: (Date.now() + 1).toString(), role: 'ai', text: data.resposta };
      setMensagensChat(prev => [...prev, novaMensagemIA]);

      if (data.creditos_restantes !== undefined) {
        setCreditosIA(data.creditos_restantes);
      }

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      setMensagensChat(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: `Ops! ❌ ${error.message}`
      }]);
    } finally {
      setLoadingIA(false);
    }
  };

  const getModalidadeIcon = (nomeModalidade) => {
    const esporte = modalidades.find(m => m.nome === nomeModalidade);
    return esporte ? esporte.icone : 'run';
  };

  const getDayOfWeek = (dateStr) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[new Date(dateStr).getDay()];
  };

  const StatPill = ({ icon, value, label, color }) => (
    <View style={[styles.statPill, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={[styles.statPillIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.statPillValue, { color: C.text }]}>{value}</Text>
      <Text style={[styles.statPillLabel, { color: C.subtext }]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

          <View style={[styles.heroCard, { backgroundColor: C.heroBg, borderColor: C.border }]}>
            <View style={[styles.orb, styles.orbLarge, { backgroundColor: C.accentMid }]} />
            <View style={[styles.orb, styles.orbSmall, { backgroundColor: C.blueDim }]} />

            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroDate, { color: C.subtext }]}>
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'short'
                  }).toUpperCase()}
                </Text>
                <Text style={[styles.heroGreeting, { color: C.text }]}>
                  Olá,{'\n'}
                  <Text style={{ color: C.accent }}>{nomeUsuario || 'Atleta'}</Text>
                </Text>
                <View style={[styles.heroStreak, { backgroundColor: C.accentDim }]}>
                  <MaterialCommunityIcons name="fire" size={14} color={C.accent} />
                  <Text style={[styles.heroStreakText, { color: C.accent }]}>Semana ativa</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('PerfilTab')}
                style={[styles.avatarBtn, { backgroundColor: C.card, borderColor: C.border }]}
              >
                <MaterialCommunityIcons name="account-outline" size={26} color={C.text} />
              </TouchableOpacity>
            </View>

            {loadingDados ? (
              <ActivityIndicator color={C.accent} style={{ marginTop: 24 }} />
            ) : (
              <View style={styles.statsRow}>
                <StatPill icon="run-fast"            value={resumoSemana.qtd}  label="Treinos" color={C.accent} />
                <StatPill icon="map-marker-distance"  value={resumoSemana.km}   label="km"      color={C.blue}  />
                <StatPill icon="fire"                value={resumoSemana.kcal} label="kcal"    color="#F59E0B" />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: C.accent }]}
            activeOpacity={0.88}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.ctaLeft}>
              <View style={styles.ctaIconWrap}>
                <MaterialCommunityIcons name="map-marker-path" size={24} color={C.accent} />
              </View>
              <View>
                <Text style={styles.ctaTitle}>Gravar Atividade</Text>
                <Text style={styles.ctaSub}>GPS + Cronômetro em tempo real</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={26} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionBar, { backgroundColor: C.accent }]} />
              <Text style={[styles.sectionTitle, { color: C.text }]}>Aprenda o Movimento</Text>
            </View>
            <FlatList
              horizontal
              data={dicas}
              keyExtractor={item => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
              ListEmptyComponent={
                !loadingDados ? (
                  <Text style={[styles.emptyText, { color: C.subtext, marginLeft: 0 }]}>
                    Nenhuma dica cadastrada ainda.
                  </Text>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dicaCard, { backgroundColor: C.card, borderColor: C.border }]}
                  activeOpacity={0.75}
                >
                  <View style={[styles.dicaIconBox, { backgroundColor: `${item.cor}15` }]}>
                    <MaterialCommunityIcons name={item.icone} size={26} color={item.cor} />
                  </View>
                  <Text style={[styles.dicaTitle, { color: C.text }]} numberOfLines={2}>{item.titulo}</Text>
                  <Text style={[styles.dicaSub, { color: C.subtext }]} numberOfLines={1}>{item.subtitulo}</Text>
                  <View style={[styles.dicaPlayBtn, { backgroundColor: C.accentDim }]}>
                    <MaterialCommunityIcons name="play" size={14} color={C.accent} />
                    <Text style={[styles.dicaPlayText, { color: C.accent }]}>Assistir</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={styles.section}>
            <View style={[styles.sectionHead, { marginBottom: 4 }]}>
              <View style={[styles.sectionBar, { backgroundColor: C.blue }]} />
              <Text style={[styles.sectionTitle, { color: C.text }]}>Atividades Recentes</Text>
            </View>

            {!loadingDados && historicoTreinos.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: C.card, borderColor: C.border }]}>
                <MaterialCommunityIcons name="run-fast" size={36} color={C.border} />
                <Text style={[styles.emptyText, { color: C.subtext }]}>Nenhuma atividade ainda.</Text>
                <Text style={{ color: C.subtext, fontSize: 13, fontWeight: '500' }}>
                  Grave sua primeira atividade acima!
                </Text>
              </View>
            ) : (
              <View style={[styles.historyCard, { backgroundColor: C.card, borderColor: C.border }]}>
                {historicoTreinos.map((treino, index) => (
                  <View key={treino.id}>
                    <View style={styles.historyRow}>
                      <View style={[styles.dayBadge, { backgroundColor: C.accentDim }]}>
                        <Text style={[styles.dayBadgeText, { color: C.accent }]}>
                          {getDayOfWeek(treino.data_treino)}
                        </Text>
                      </View>
                      <View style={[styles.historyIconWrap, { backgroundColor: C.cardAlt }]}>
                        <MaterialCommunityIcons
                          name={getModalidadeIcon(treino.modalidade)}
                          size={20} color={C.accent}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyType, { color: C.text }]}>{treino.modalidade}</Text>
                        <Text style={[styles.historyMeta, { color: C.subtext }]}>
                          {treino.distancia_km}km · {treino.duracao_minutos}min
                        </Text>
                      </View>
                      <View style={[styles.kcalBadge, { backgroundColor: C.cardAlt }]}>
                        <MaterialCommunityIcons name="fire" size={12} color="#F59E0B" />
                        <Text style={[styles.kcalText, { color: C.text }]}>{treino.calorias}</Text>
                      </View>
                    </View>
                    {index < historicoTreinos.length - 1 && (
                      <View style={[styles.divider, { backgroundColor: C.border }]} />
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

        </ScrollView>

        <TouchableOpacity style={styles.fab} activeOpacity={0.88} onPress={() => setChatVisible(true)}>
          <View style={styles.fabInner}>
            <MaterialCommunityIcons name="robot-outline" size={26} color="#FFF" />
          </View>
          <View style={[styles.fabPulse, { borderColor: C.blue }]} />
        </TouchableOpacity>

        {/* MODAL ESPORTE */}
        <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
            <Pressable style={[styles.bottomSheet, { backgroundColor: C.bg, maxHeight: '80%' }]}>
              <View style={[styles.sheetHandle, { backgroundColor: C.border }]} />
              <Text style={[styles.sheetTitle, { color: C.text }]}>Qual atividade hoje?</Text>
              <Text style={[styles.sheetSub, { color: C.subtext }]}>Escolha a modalidade que deseja registrar</Text>

              {modalidades.length === 0 ? (
                <ActivityIndicator size="small" color={C.accent} style={{ marginVertical: 30 }} />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  {modalidades.map(sport => {
                    const cor = sport.usa_gps ? C.accent : C.blue;
                    return (
                      <TouchableOpacity
                        key={sport.id}
                        style={[styles.sportBtn, { borderBottomColor: C.border }]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setModalVisible(false);
                          navigation.navigate('Tracking', { modalidade: sport.nome, usaGps: sport.usa_gps });
                        }}
                      >
                        <View style={[styles.sportIconWrap, { backgroundColor: `${cor}15` }]}>
                          <MaterialCommunityIcons name={sport.icone} size={28} color={cor} />
                        </View>
                        <View style={styles.sportInfo}>
                          <Text style={[styles.sportName, { color: C.text }]}>{sport.nome}</Text>
                          <View style={styles.sportTagRow}>
                            {sport.usa_gps ? (
                              <View style={[styles.tag, { backgroundColor: `${C.accent}20` }]}>
                                <MaterialCommunityIcons name="satellite-uplink" size={12} color={C.accent} />
                                <Text style={[styles.tagText, { color: C.accent }]}>Rota GPS</Text>
                              </View>
                            ) : (
                              <View style={[styles.tag, { backgroundColor: `${C.subtext}20` }]}>
                                <MaterialCommunityIcons name="timer-outline" size={12} color={C.subtext} />
                                <Text style={[styles.tagText, { color: C.subtext }]}>Tempo e Kcal</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={C.subtext} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* MODAL CHAT */}
        <Modal animationType="slide" transparent visible={chatVisible} onRequestClose={() => setChatVisible(false)}>
          <View style={styles.overlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.chatSheet, { backgroundColor: C.bg }]}
            >
              <View style={[styles.chatHeader, { borderBottomColor: C.border }]}>
                <View style={styles.chatHeaderLeft}>
                  <View style={[styles.chatBotIcon, { backgroundColor: C.blue }]}>
                    <MaterialCommunityIcons name="robot-outline" size={18} color="#FFF" />
                  </View>
                  <View>
                    <Text style={[styles.chatTitle, { color: C.text }]}>FitMind AI</Text>
                    <View style={styles.chatOnline}>
                      <View style={[styles.onlineDot, { backgroundColor: C.accent }]} />
                      <Text style={[styles.onlineText, { color: C.accent }]}>Online agora</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.chatHeaderRight}>
                  {creditosIA !== null && (
                    <View style={[styles.creditBadge, { backgroundColor: C.blueDim }]}>
                      <MaterialCommunityIcons name="lightning-bolt" size={13} color={C.blue} />
                      <Text style={[styles.creditText, { color: C.blue }]}>{creditosIA}</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => setChatVisible(false)}
                    style={[styles.closeBtn, { backgroundColor: C.card }]}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={C.subtext} />
                  </Pressable>
                </View>
              </View>

              <FlatList
                ref={flatListRef}
                data={mensagensChat}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => {
                  const isUser = item.role === 'user';
                  return (
                    <View style={[styles.bubbleWrap, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
                      {!isUser && (
                        <View style={[styles.bubbleAvatar, { backgroundColor: C.blue }]}>
                          <MaterialCommunityIcons name="robot-outline" size={12} color="#FFF" />
                        </View>
                      )}
                      <View style={[
                        styles.bubble,
                        {
                          backgroundColor: isUser ? C.accent : C.chatAiBg,
                          borderColor: isUser ? 'transparent' : C.border,
                          borderBottomRightRadius: isUser ? 4 : 18,
                          borderBottomLeftRadius: isUser ? 18 : 4,
                        }
                      ]}>
                        <Text style={[styles.bubbleText, { color: isUser ? '#FFF' : C.chatAiText }]}>
                          {item.text}
                        </Text>
                      </View>
                    </View>
                  );
                }}
              />

              {loadingIA && (
                <View style={styles.typingRow}>
                  <View style={[styles.typingBubble, { backgroundColor: C.chatAiBg, borderColor: C.border }]}>
                    <ActivityIndicator size="small" color={C.blue} />
                    <Text style={[styles.typingText, { color: C.subtext }]}>Pensando...</Text>
                  </View>
                </View>
              )}

              <View style={[styles.inputRow, { backgroundColor: C.card, borderColor: C.border }]}>
                <TextInput
                  style={[styles.chatInput, { color: C.text }]}
                  placeholder="Peça uma análise do seu treino..."
                  placeholderTextColor={C.subtext}
                  value={pergunta}
                  onChangeText={setPergunta}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: pergunta.trim() ? C.accent : C.border }]}
                  onPress={perguntarParaIA}
                  disabled={loadingIA || !pergunta.trim()}
                >
                  <MaterialCommunityIcons name="send" size={18} color={pergunta.trim() ? '#FFF' : C.subtext} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroCard: { marginHorizontal: 20, marginTop: 16, marginBottom: 24, borderRadius: 32, borderWidth: 1, padding: 24, overflow: 'hidden', position: 'relative' },
  orb: { position: 'absolute', borderRadius: 999 },
  orbLarge: { width: 180, height: 180, top: -60, right: -50 },
  orbSmall: { width: 80, height: 80, bottom: -20, right: 80 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  heroDate: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  heroGreeting: { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 38, marginBottom: 12 },
  heroStreak: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroStreakText: { fontSize: 12, fontWeight: '700' },
  avatarBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 20, borderWidth: 1, gap: 4 },
  statPillIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statPillValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  statPillLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  ctaBtn: { marginHorizontal: 20, marginBottom: 32, borderRadius: 28, paddingVertical: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#10B981', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { height: 8, width: 0 }, elevation: 8 },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ctaIconWrap: { backgroundColor: '#FFF', width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  ctaTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  ctaSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500', marginTop: 2 },
  section: { marginBottom: 32 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, gap: 10 },
  sectionBar: { width: 4, height: 20, borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  dicaCard: { width: 200, marginRight: 14, borderRadius: 24, borderWidth: 1, padding: 18 },
  dicaIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  dicaTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4, lineHeight: 20 },
  dicaSub: { fontSize: 13, fontWeight: '500', marginBottom: 14 },
  dicaPlayBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start' },
  dicaPlayText: { fontSize: 12, fontWeight: '700' },
  historyCard: { marginHorizontal: 20, borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, gap: 12 },
  dayBadge: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dayBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  historyIconWrap: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  historyType: { fontSize: 15, fontWeight: '800' },
  historyMeta: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  kcalBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  kcalText: { fontSize: 13, fontWeight: '800' },
  divider: { height: 1, marginHorizontal: 18 },
  emptyBox: { marginHorizontal: 20, borderRadius: 28, borderWidth: 1, paddingVertical: 36, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  fab: { position: 'absolute', bottom: 28, right: 24, width: 62, height: 62, justifyContent: 'center', alignItems: 'center' },
  fabInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#3B82F6', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { height: 6, width: 0 } },
  fabPulse: { position: 'absolute', width: 74, height: 74, borderRadius: 37, borderWidth: 2, opacity: 0.3 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  bottomSheet: { borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 4, alignSelf: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  sheetSub: { fontSize: 14, fontWeight: '500', marginBottom: 20 },
  sportBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  sportIconWrap: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  sportInfo: { flex: 1 },
  sportName: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sportTagRow: { flexDirection: 'row' },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  tagText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  chatSheet: { height: '88%', borderTopLeftRadius: 36, borderTopRightRadius: 36 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: 20, paddingVertical: 16 },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatBotIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  chatTitle: { fontSize: 17, fontWeight: '800' },
  chatOnline: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 12, fontWeight: '600' },
  creditBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  creditText: { fontSize: 13, fontWeight: '800' },
  closeBtn: { width: 38, height: 38, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  bubbleAvatar: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 20, borderWidth: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  typingRow: { paddingHorizontal: 16, paddingBottom: 8 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  typingText: { fontSize: 13, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 12, borderWidth: 1, borderRadius: 28, paddingHorizontal: 8, paddingVertical: 6 },
  chatInput: { flex: 1, paddingHorizontal: 12, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});