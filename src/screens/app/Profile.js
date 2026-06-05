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
  const { isDark, setIsDark, colors } = useContext(ThemeContext);

  const dangerColor = '#EF4444';
  const warningColor = '#F59E0B';

  const [perfil, setPerfil] = useState({
    nome: '', email: '', peso_kg: '', altura_cm: '', sexo: '', data_nascimento: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  const [form, setForm] = useState({ peso_kg: '', altura_cm: '', nome: '' });

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
    return (peso / (alturaM * alturaM)).toFixed(1);
  };

  const getIMCStatus = (imc) => {
    if (imc < 18.5) return { texto: 'Abaixo do peso', cor: warningColor };
    if (imc < 25)   return { texto: 'Peso normal', cor: colors.accent };
    if (imc < 30)   return { texto: 'Sobrepeso', cor: warningColor };
    return { texto: 'Obesidade', cor: dangerColor };
  };

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from('perfis').select('*').eq('id', user.id).maybeSingle();
      if (error) console.warn('Erro ao buscar perfil:', error.message);

      const perfilData = data || {};
      setPerfil({
        nome: perfilData.nome || '',
        email: user.email || '',
        peso_kg: perfilData.peso_kg || '',
        altura_cm: perfilData.altura_cm || '',
        sexo: perfilData.sexo || '',
        data_nascimento: perfilData.data_nascimento || '',
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirEdicao = () => {
    setForm({
      nome: perfil.nome || '',
      peso_kg: perfil.peso_kg ? String(perfil.peso_kg) : '',
      altura_cm: perfil.altura_cm ? String(perfil.altura_cm) : '',
    });
    setEditVisible(true);
  };

  const salvarEdicao = async () => {
    const pesoTratado = form.peso_kg.replace(',', '.');
    
    const pesoNumerico = parseFloat(pesoTratado);
    const alturaNumerica = parseInt(form.altura_cm);
    
    if (isNaN(pesoNumerico) || pesoNumerico < 30 || pesoNumerico > 300) return Alert.alert('Aviso', 'Informe um peso válido entre 30 e 300 kg.');
    if (isNaN(alturaNumerica) || alturaNumerica < 100 || alturaNumerica > 250) return Alert.alert('Aviso', 'Informe uma altura válida entre 100 e 250 cm.');
    if (!form.nome.trim()) return Alert.alert('Aviso', 'O nome é obrigatório.');

    try {
      setSalvando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada');

      const { error } = await supabase.from('perfis').upsert({
        id: user.id,
        nome: form.nome.trim(),
        peso_kg: pesoNumerico,
        altura_cm: alturaNumerica,
      }, { onConflict: 'id' });
      
      if (error) throw error;
      
      await carregarPerfil(); 
      setEditVisible(false);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  };

  const fazerLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja desconectar?', [
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

  const InfoRow = ({ icon, label, value, color = colors.text, showBorder = true }) => (
    <View style={[styles.infoRow, showBorder && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.divider }]}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.sub} />
      </View>
      <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.infoValue, { color }]}>{value || '—'}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerLoading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Perfil</Text>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={abrirEdicao}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.text} />
            <Text style={[styles.editBtnText, { color: colors.text }]}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar + Nome */}
        <View style={styles.section}>
          <View style={[styles.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.avatarLetter, { color: colors.accent }]}>
                {perfil.nome ? perfil.nome.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.text }]}>{perfil.nome || 'Usuário FitMind'}</Text>
              <Text style={[styles.userEmail, { color: colors.sub }]}>{perfil.email}</Text>
              
              {/* Só exibe Idade/Sexo se estiverem preenchidos no banco */}
              {(idade || perfil.sexo) && (
                <Text style={[styles.userAge, { color: colors.sub }]}>
                  {idade ? `${idade} anos` : ''} {idade && perfil.sexo ? '•' : ''} {perfil.sexo === 'M' ? 'Masculino' : perfil.sexo === 'F' ? 'Feminino' : ''}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Dados Físicos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados Físicos</Text>
          <View style={[styles.cardBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoRow icon="weight-kilogram" label="Peso" value={perfil.peso_kg ? `${perfil.peso_kg} kg` : null} />
            <InfoRow icon="human-male-height" label="Altura" value={perfil.altura_cm ? `${perfil.altura_cm} cm` : null} />
            {imc && imcStatus ? (
              <InfoRow icon="heart-pulse" label="IMC" value={`${imc} • ${imcStatus.texto}`} color={imcStatus.cor} showBorder={false} />
            ) : (
              <InfoRow icon="heart-pulse" label="IMC" value={null} showBorder={false} />
            )}
          </View>

          {/* Aviso se o perfil estiver incompleto */}
          {(!perfil.peso_kg || !perfil.altura_cm) && (
            <TouchableOpacity style={[styles.alertBox, { backgroundColor: warningColor + '15', borderColor: warningColor + '30' }]} onPress={abrirEdicao}>
              <MaterialCommunityIcons name="information-outline" size={20} color={warningColor} />
              <Text style={[styles.alertText, { color: warningColor }]}>Complete seus dados para calcular o seu IMC corretamente.</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Configurações */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aplicativo</Text>
          <View style={[styles.cardBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.divider }]}>
                <MaterialCommunityIcons name="theme-light-dark" size={20} color={colors.sub} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Modo Escuro</Text>
              <Switch
                value={isDark}
                onValueChange={setIsDark}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={fazerLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={dangerColor} />
          <Text style={[styles.logoutText, { color: dangerColor }]}>Sair da conta</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal de Edição Dinâmico */}
      <Modal animationType="slide" transparent visible={editVisible} onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={[styles.editSheet, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.divider }]} />
            
            <View style={styles.modalHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Editar Dados</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={24} color={colors.sub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* Input Nome */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Nome de Exibição</Text>
                <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.fieldText, { color: colors.text }]}
                    placeholder="Seu nome"
                    placeholderTextColor={colors.sub}
                    value={form.nome}
                    onChangeText={v => setForm(prev => ({ ...prev, nome: v }))}
                  />
                </View>
              </View>

              {/* Input Peso */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Peso Atual (kg)</Text>
                <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.fieldText, { color: colors.text }]}
                    placeholder="Ex: 75.5"
                    placeholderTextColor={colors.sub}
                    keyboardType="decimal-pad"
                    value={form.peso_kg}
                    onChangeText={v => setForm(prev => ({ ...prev, peso_kg: v }))}
                  />
                </View>
              </View>

              {/* Input Altura */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Altura (cm)</Text>
                <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.fieldText, { color: colors.text }]}
                    placeholder="Ex: 175"
                    placeholderTextColor={colors.sub}
                    keyboardType="number-pad"
                    value={form.altura_cm}
                    onChangeText={v => setForm(prev => ({ ...prev, altura_cm: v }))}
                  />
                </View>
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: salvando ? 0.7 : 1 }]} onPress={salvarEdicao} disabled={salvando}>
                {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Salvar Alterações</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  editBtnText: { fontSize: 14, fontWeight: '600' },
  
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
  
  avatarCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 24, borderWidth: 1 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 26, fontWeight: '800' },
  userName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  userEmail: { fontSize: 14 },
  userAge: { fontSize: 13, marginTop: 4 },
  
  cardBlock: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '700' },
  
  alertBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  alertText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginHorizontal: 20, padding: 16, borderRadius: 20, borderWidth: 1 },
  logoutText: { fontSize: 16, fontWeight: '600' },
  
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16, borderWidth: 1, borderBottomWidth: 0, maxHeight: '85%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 22, fontWeight: '800' },
  closeBtn: { padding: 4 },
  
  inputGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  fieldInput: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 56, justifyContent: 'center' },
  fieldText: { fontSize: 16, fontWeight: '500' },
  
  saveBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});