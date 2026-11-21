import { beforeEach } from 'vitest';

// js/core/supabase.js expects the supabase-js CDN script to have put
// `supabase` on window. Unit tests never hit the network, so a bare stub.
window.supabase = { createClient: () => ({}) };

beforeEach(() => localStorage.clear());
