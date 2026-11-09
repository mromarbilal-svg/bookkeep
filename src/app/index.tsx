import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RATES: Record<string, number> = {
  SEK: 1,
  USD: 0.095,   // 1 SEK ≈ 0.095 USD
  AED: 0.35,    // 1 SEK ≈ 0.35 AED
};

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [companyName, setCompanyName] = useState('');
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [displayCurrency, setDisplayCurrency] = useState('SEK');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) router.replace('/(auth)/login');
      else fetchSummary();
    });

    async function loadCompanyName() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase.from('profiles').select('company_name').eq('id', user.id).single();
  if (data?.company_name) setCompanyName(data.company_name);
}
loadCompanyName();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.replace('/(auth)/login');
      else fetchSummary();
    });

    return () => listener.subscription.unsubscribe();
  }, [displayCurrency]);

async function fetchSummary() {
  const { data } = await supabase.from('transactions').select('amount, type, currency');
  if (!data) return;

  let income = 0;
  let expense = 0;

  data.forEach((t) => {
    const rate = RATES[t.currency || 'SEK'] || 1;
    const converted = Number(t.amount) / rate * (RATES[displayCurrency] || 1);
    if (t.type === 'income') income += converted;
    else expense += converted;
  });

  setSummary({ income, expense });
}

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (!user) return null;

  const balance = summary.income - summary.expense;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111' : '#f8f9fa' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#111' }]}>
  {companyName || 'Bookkeep'}
</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
<Text style={[styles.balance, balance >= 0 ? styles.positive : styles.negative]}>
  {balance.toFixed(2)} {displayCurrency}
</Text>
        <View style={styles.summaryRow}>
  {['SEK', 'USD', 'AED'].map((cur) => (
    <TouchableOpacity key={cur} onPress={() => setDisplayCurrency(cur)}>
      <Text style={[styles.summaryLabel, displayCurrency === cur && { fontWeight: '700', color: '#111' }]}>
        {cur}
      </Text>
    </TouchableOpacity>
  ))}
</View>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.income}>{summary.income.toFixed(2)}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.expense}>{summary.expense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/transactions')}>
        <Text style={styles.cardTitle}>Transactions</Text>
        <Text style={styles.cardSubtitle}>Add and view income & expenses</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/settings' as any)}>
  <Text style={styles.cardTitle}>Settings</Text>
  <Text style={styles.cardSubtitle}>Company name and preferences</Text>
</TouchableOpacity>

      <TouchableOpacity style={styles.logout} onPress={signOut}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  header: { marginBottom: 24, marginTop: 12 },
  title: { fontSize: 34, fontWeight: '700', color: '#111' },
  email: { fontSize: 15, color: '#666', marginTop: 4 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 24 },
  balanceLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  balance: { fontSize: 36, fontWeight: '700', marginBottom: 20 },
  positive: { color: '#16a34a' },
  negative: { color: '#dc2626' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#888', marginBottom: 4 },
  income: { fontSize: 18, fontWeight: '600', color: '#16a34a' },
  expense: { fontSize: 18, fontWeight: '600', color: '#dc2626' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#666' },
  logout: { marginTop: 'auto', alignItems: 'center', padding: 16 },
  logoutText: { color: '#888', fontSize: 15 },
});