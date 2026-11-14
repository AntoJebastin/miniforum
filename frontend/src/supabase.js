import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  'https://ekziwlifpivecurogtdi.supabase.co';

const supabaseKey = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'sb_publishable_phcMTpOh3Z9bDp4qY6gKJw_vDrNsq97';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
