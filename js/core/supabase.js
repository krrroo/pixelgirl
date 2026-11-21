import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// supabase-js is loaded as a UMD script from the CDN (see the HTML <head>),
// which puts `supabase` on window. One client for the whole app.
export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
