/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
const env = meta.env || {};

const supabaseUrl: string = 
  env.VITE_SUPABASE_URL || 
  'https://ekziwlifpivecurogtdi.supabase.co';

const supabaseKey: string = 
  env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  env.VITE_SUPABASE_ANON_KEY || 
  'sb_publishable_phcMTpOh3Z9bDp4qY6gKJw_vDrNsq97';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
