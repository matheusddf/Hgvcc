import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://bsowndrhyajgiepphkff.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzb3duZHJoeWFqZ2llcHBoa2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTYzNDQsImV4cCI6MjA5MTQ5MjM0NH0.8CA9d42aC7ecyIcDDi6SG2rVpzdCHRPKuKytUsXFS6w';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL ou Anon Key não encontrados. Verifique as variáveis de ambiente.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
