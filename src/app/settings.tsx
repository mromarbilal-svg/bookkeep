import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('profiles').select('company_name').eq('id', user.id).single();
    if (data?.company_name) setCompanyName(data.company_name);
  }

  async function save() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      company_name: companyName,
    });

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Saved', 'Company name updated');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.label}>Company name</Text>
      <TextInput
        style={styles.input}
        value={companyName}
        onChangeText={setCompanyName}
        placeholder="Enter company name"
      />
      <TouchableOpacity style={styles.button} onPress={save} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={toggleTheme}>
  <Text style={styles.buttonText}>Switch to {theme === 'light' ? 'Dark' : 'Light'} mode</Text>
</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#e5e5e5', marginBottom: 20 },
  button: { backgroundColor: '#111', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});