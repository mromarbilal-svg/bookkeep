import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  created_at: string;
};

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Salary', 'Rent', 'Other'];

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Error', error.message);
    else setTransactions(data || []);
  }

  async function addTransaction() {
    const numAmount = parseFloat(amount);
    if (!numAmount || !category) {
      Alert.alert('Error', 'Amount and category are required');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount: numAmount,
      type,
      category,
      description: description || null,
    });

    if (error) Alert.alert('Error', error.message);
    else {
      setAmount('');
      setCategory('');
      setDescription('');
      fetchTransactions();
    }
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else fetchTransactions();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Transaction</Text>

      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
          onPress={() => setType('expense')}
        >
          <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
          onPress={() => setType('income')}
        >
          <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />

      <View style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, category === cat && styles.catBtnActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Description (optional)" value={description} onChangeText={setDescription} />

      <TouchableOpacity style={styles.addButton} onPress={addTransaction}>
        <Text style={styles.addButtonText}>Add Transaction</Text>
      </TouchableOpacity>

      <Text style={styles.listTitle}>Recent</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemCategory}>{item.category}</Text>
              {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
            </View>
            <Text style={[styles.itemAmount, item.type === 'income' ? styles.income : styles.expense]}>
              {item.type === 'income' ? '+' : '-'}{item.amount}
            </Text>
            <TouchableOpacity onPress={() => deleteTransaction(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
      />
    </View>
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
  addButton: { backgroundColor: '#111', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 28 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  listTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#111' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
  itemCategory: { fontWeight: '600', fontSize: 16 },
  itemDesc: { color: '#666', fontSize: 13, marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '700', marginRight: 12 },
  income: { color: '#16a34a' },
  expense: { color: '#dc2626' },
  deleteBtn: { padding: 6 },
  deleteText: { color: '#999', fontSize: 18 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});