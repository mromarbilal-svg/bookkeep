import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vvuuhukxhrdecmbtygga.supabase.co';
const supabaseAnonKey = 'sb_publishable_X-He10DRvsT0ewO3fYHPdA_u5dOyjCG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);