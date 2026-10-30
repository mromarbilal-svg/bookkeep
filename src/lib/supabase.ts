import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.com/dashboard/project/vvuuhukxhrdecmbtygga';
const supabaseAnonKey = 'vvuuhukxhrdecmbtygga';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);