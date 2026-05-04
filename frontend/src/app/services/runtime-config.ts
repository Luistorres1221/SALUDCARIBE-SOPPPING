export interface RuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
}

const env = (window as any).__env || {};

export const runtimeConfig: RuntimeConfig = {
  supabaseUrl: env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
  supabaseAnonKey: env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
  apiBaseUrl: env.API_BASE_URL || 'http://localhost:8081/api'
};
