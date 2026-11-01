import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  created_at: string;
  receipt_url: string | null;
  transaction_date: string;
  period: string | null;
};

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Salary', 'Rent', 'Other'];

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false });
    if (error) Alert.alert('Error', error.message);
    else setTransactions(data || []);
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setReceipt(result.assets[0].uri);
  }

  async function uploadReceipt(uri: string, transactionId: string) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `${transactionId}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('receipts').upload(fileName, blob, { contentType: 'image/jpeg' });
    if (error) {
      Alert.alert('Upload error', error.message);
      return null;
    }
    const { data } = supabase.storage.from('receipts').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function addTransaction() {
    const numAmount = parseFloat(amount);
    if (!numAmount || !category) {
      Alert.alert('Error', 'Amount and category are required');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const period = date.slice(0, 7); // YYYY-MM

    const { data, error } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount: numAmount,
      type,
      category,
      description: description || null,
      transaction_date: date,
      period,
    }).select().single();

    if (error || !data) {
      Alert.alert('Error', error?.message || 'Failed to add');
      return;
    }

    if (receipt) {
      const receiptUrl = await uploadReceipt(receipt, data.id);
      if (receiptUrl) {
        await supabase.from('transactions').update({ receipt_url: receiptUrl }).eq('id', data.id);
      }
    }

    setAmount('');
    setCategory('');
    setDescription('');
    setReceipt(null);
    setDate(new Date().toISOString().split('T')[0]);
    fetchTransactions();
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else fetchTransactions();
  }

  const grouped = transactions.reduce((acc, t) => {
    const key = t.period || 'No period';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Transaction</Text>

      <View style={styles.typeRow}>
        <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]} onPress={() => setType('expense')}>
          <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]} onPress={() => setType('income')}>
          <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />

      <View style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.catBtn, category === cat && styles.catBtnActive]} onPress={() => setCategory(cat)}>
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Description (optional)" value={description} onChangeText={setDescription} />

      <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
        <Text style={styles.photoBtnText}>{receipt ? 'Photo selected' : 'Attach receipt photo'}</Text>
      </TouchableOpacity>
      {receipt && <Image source={{ uri: receipt }} style={styles.preview} />}

      <TouchableOpacity style={styles.addButton} onPress={addTransaction}>
        <Text style={styles.addButtonText}>Add Transaction</Text>
      </TouchableOpacity>

      <Text style={styles.listTitle}>By Period</Text>
      {Object.keys(grouped).sort().reverse().map((period) => {
        const items = grouped[period];
  const income = items.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = items.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  return (
        <View key={period} style={styles.periodBlock}>
          <Text style={styles.periodTitle}>{period}</Text>
          <View style={styles.summaryRow}>
  <Text style={styles.income}>Income: {income.toFixed(2)}</Text>
  <Text style={styles.expense}>Expenses: {expense.toFixed(2)}</Text>
  <Text style={balance >= 0 ? styles.income : styles.expense}>Balance: {balance.toFixed(2)}</Text>
</View>
          {grouped[period].map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemCategory}>{item.category}</Text>
                {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
                <Text style={styles.itemDate}>{item.transaction_date}</Text>
                {item.receipt_url && <Image source={{ uri: item.receipt_url }} style={styles.receiptThumb} />}
              </View>
              <Text style={[styles.itemAmount, item.type === 'income' ? styles.income : styles.expense]}>
                {item.type === 'income' ? '+' : '-'}{item.amount}
              </Text>
              <TouchableOpacity onPress={() => deleteTransaction(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      );})}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 20, color: '#111' },
  typeRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5e5' },
  typeBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  typeText: { fontWeight: '600', color: '#333' },
  typeTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#e5e5e5' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5e5' },
  catBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  catText: { fontSize: 14, color: '#333' },
  catTextActive: { color: '#fff' },
  photoBtn: { backgroundColor: '#fff', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e5e5e5' },
  photoBtnText: { fontWeight: '600', color: '#333' },
  preview: { width: 80, height: 80, borderRadius: 8, marginBottom: 12 },
  addButton: { backgroundColor: '#111', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 28 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  listTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#111' },
  periodBlock: { marginBottom: 24 },
  periodTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#333' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
  itemCategory: { fontWeight: '600', fontSize: 16 },
  itemDesc: { color: '#666', fontSize: 13, marginTop: 2 },
  itemDate: { color: '#999', fontSize: 12, marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '700', marginRight: 12 },
  income: { color: '#16a34a' },
  expense: { color: '#dc2626' },
  deleteBtn: { padding: 6 },
  deleteText: { color: '#999', fontSize: 18 },
  receiptThumb: { width: 40, height: 40, borderRadius: 6, marginTop: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
});