import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert,
  ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function Perfil({ navigation }) {
  const { isDark, setIsDark } = useContext(ThemeContext);

  const [perfil, setPerfil] = useState({
    nome: '', email: '', ia_creditos: 0,
    peso_kg: '', altura_cm: '', sexo: 'M', data_nascimento: ''
  });
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ peso_kg: '', altura_cm: '', nome: '' });

  const C = {
    bg:     isDark ? '#0B1120' : '#F8FAFC',
    card:   isDark ? '#1E293B' : '#FFFFFF',
    text:   isDark ? '#F1F5F9' : '#0F172A',
    sub:    isDark ? '#94A3B8' : '#64748B',
    accent: '#10B981',
    blue:   '#3B82F6',
    border: isDark ? '#334155' : '#E2E8F0',
    danger: '#EF4444',
    input:  isDark ? '#0F2035' : '#F1F5F9',
  };

  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return null;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const calcularIMC = (peso, altura) => {
    if (!peso || !altura) return null;
    const alturaM = altura / 100;
    const imc = peso / (alturaM * alturaM);
    return imc.toFixed(1);
  };

  const getIMCStatus = (imc) => {
    if (imc < 18.5) return { texto: 'Abaixo do peso', cor: '#F59E0B' };
    if (imc < 25)   return { texto: 'Peso normal', cor: C.accent };
    if (imc < 30)   return { texto: 'Sobrepeso', cor: '#F59E0B' };
    return { texto: 'Obesidade', cor: C.danger };
  };

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Erro ao buscar perfil:', error.message);
      }

      const perfilData = data || {};
      setPerfil({
        nome:             perfilData.nome || '',
        email:            user.email || '',
        ia_creditos:      perfilData.ia_creditos || 0,
        peso_kg:          perfilData.peso_kg || '',
        altura_cm:        perfilData.altura_cm || '',
        sexo:             perfilData.sexo || 'M',
        data_nascimento:  perfilData.data_nascimento || '',
      });
      setForm({
        nome: perfilData.nome || '',
        peso_kg: String(perfilData.peso_kg || ''),
        altura_cm: String(perfilData.altura_cm || ''),
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarEdicao = async () => {
    const peso = parseFloat(form.peso_kg);
    const altura = parseInt(form.altura_cm);
    if (isNaN(peso) || peso < 30 || peso > 300) {
      Alert.alert('Peso inválido', 'Informe um peso entre 30 e 300 kg.'); return;
    }
    if (isNaN(altura) || altura < 100 || altura > 250) {
      Alert.alert('Altura inválida', 'Informe uma altura entre 100 e 250 cm.'); return;
    }
    if (!form.nome.trim()) {
      Alert.alert('Nome inválido', 'Informe seu nome.'); return;
    }
    try {
      setSalvando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessao expirada');

      const { error } = await supabase
        .from('perfis')
        .upsert({
          id: user.id,
          nome: form.nome.trim(),
          peso_kg: peso,
          altura_cm: altura,
        }, { onConflict: 'id' });
      if (error) throw error;
      await carregarPerfil();
      setEditVisible(false);
      Alert.alert('✅ Perfil atualizado!');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const fazerLogout = async () => {
    Alert.alert('Sair', 'Tem certeza que deseja desconectar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        navigation.replace('Login');
      }},
    ]);
  };

  const imc = calcularIMC(Number(perfil.peso_kg), Number(perfil.altura_cm));
  const imcStatus = imc ? getIMCStatus(Number(imc)) : null;
  const idade = calcularIdade(perfil.data_nascimento);

  const InfoRow = ({ icon, label, value, color = C.text }) => (
    <View style={[styles.infoRow, { borderBottomColor: C.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: `${C.accent}15` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={C.accent} />
      </View>
      <Text style={[styles.infoLabel, { color: C.sub }]}>{label}</Text>
      <Text style={[styles.infoValue, { color }]}>{value || '—'}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>Meu Perfil</Text>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: C.card, borderColor: C.border }]}
            onPress={() => setEditVisible(true)}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={C.accent} />
            <Text style={[styles.editBtnText, { color: C.accent }]}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar + Nome */}
        <View style={[styles.avatarCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: `${C.accent}20` }]}>
            <Text style={[styles.avatarLetter, { color: C.accent }]}>
              {perfil.nome ? perfil.nome.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: C.text }]}>{perfil.nome || 'Atleta'}</Text>
            <Text style={[styles.userEmail, { color: C.sub }]}>{perfil.email}</Text>
            {idade && (
              <Text style={[styles.userAge, { color: C.sub }]}>{idade} anos · {perfil.sexo === 'M' ? 'Masculino' : 'Feminino'}</Text>
            )}
          </View>
        </View>

        {/* Card IA */}
        <View style={[styles.iaCard, { backgroundColor: C.blue }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.iaLabel}>Fichas IA disponíveis</Text>
            <Text style={styles.iaCreditos}>{perfil.ia_creditos}</Text>
          </View>
          <MaterialCommunityIcons name="robot-outline" size={40} color="rgba(255,255,255,0.3)" />
        </View>

        {/* Dados Físicos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Dados Físicos</Text>
          <View style={[styles.infoCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <InfoRow icon="weight-kilogram" label="Peso" value={perfil.peso_kg ? `${perfil.peso_kg} kg` : null} />
            <InfoRow icon="human-male-height" label="Altura" value={perfil.altura_cm ? `${perfil.altura_cm} cm` : null} />
            {imc && imcStatus && (
              <InfoRow icon="heart-pulse" label="IMC" value={`${imc} — ${imcStatus.texto}`} color={imcStatus.cor} />
            )}
          </View>
          {!perfil.peso_kg && (
            <TouchableOpacity
              style={[styles.completeBtn, { borderColor: C.accent }]}
              onPress={() => setEditVisible(true)}
            >
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={C.accent} />
              <Text style={[styles.completeBtnText, { color: C.accent }]}>Complete seu perfil para cálculos precisos de kcal</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Configurações */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Configurações</Text>
          <View style={[styles.infoCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.settingRow, { borderBottomColor: C.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: `${C.sub}15` }]}>
                <MaterialCommunityIcons name="theme-light-dark" size={18} color={C.sub} />
              </View>
              <Text style={[styles.infoLabel, { color: C.text, flex: 1 }]}>Modo Escuro</Text>
              <Switch
                value={isDark}
                onValueChange={setIsDark}
                trackColor={{ false: C.border, true: C.accent }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: C.danger }]}
          onPress={fazerLogout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={22} color={C.danger} />
          <Text style={[styles.logoutText, { color: C.danger }]}>Sair do Aplicativo</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal de Edição */}
      <Modal animationType="slide" transparent visible={editVisible} onRequestClose={() => setEditVisible(false)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.editSheet, { backgroundColor: C.bg }]}>
            <View style={[styles.sheetHandle, { backgroundColor: C.border }]} />
            <Text style={[styles.sheetTitle, { color: C.text }]}>Editar Perfil</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Nome completo', key: 'nome', keyboard: 'default', placeholder: 'Seu nome' },
                { label: 'Peso (kg)', key: 'peso_kg', keyboard: 'decimal-pad', placeholder: 'Ex: 75.5' },
                { label: 'Altura (cm)', key: 'altura_cm', keyboard: 'number-pad', placeholder: 'Ex: 175' },
              ].map(field => (
                <View key={field.key} style={{ marginBottom: 18 }}>
                  <Text style={[styles.fieldLabel, { color: C.sub }]}>{field.label}</Text>
                  <View style={[styles.fieldInput, { backgroundColor: C.input, borderColor: C.border }]}>
                    <TextInput
                      style={[styles.fieldText, { color: C.text }]}
                      placeholder={field.placeholder}
                      placeholderTextColor={C.sub}
                      keyboardType={field.keyboard}
                      value={form[field.key]}
                      onChangeText={v => setForm(prev => ({ ...prev, [field.key]: v }))}
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: C.accent, opacity: salvando ? 0.7 : 1 }]}
                onPress={salvarEdicao}
                disabled={salvando}
              >
                {salvando
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.saveBtnText}>Salvar Alterações</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: C.border }]}
                onPress={() => setEditVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: C.sub }]}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  editBtnText: { fontSize: 14, fontWeight: '700' },
  avatarCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 24, padding: 20, borderRadius: 28, borderWidth: 1, marginBottom: 20 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 32, fontWeight: '900' },
  userName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  userEmail: { fontSize: 13, marginBottom: 2 },
  userAge: { fontSize: 13, marginTop: 2 },
  iaCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, padding: 22, borderRadius: 28, marginBottom: 28, elevation: 6, shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 12 },
  iaLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  iaCreditos: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  section: { marginHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  infoCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '700' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  completeBtnText: { fontSize: 13, fontWeight: '600', flex: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginHorizontal: 24, padding: 18, borderRadius: 24, borderWidth: 1.5 },
  logoutText: { fontSize: 16, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  editSheet: { borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 4, alignSelf: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 24, fontWeight: '900', marginBottom: 28 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 56, justifyContent: 'center' },
  fieldText: { fontSize: 16, fontWeight: '500' },
  saveBtn: { height: 58, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 4 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  cancelBtn: { height: 52, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
});