// Site-wide configuration. The Supabase key is the publishable (anon) key:
// safe in client code — row-level security policies decide what it can do.
export const SUPABASE_URL = 'https://ydgolqvrhppqyqioymlk.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_IUwxXSr3JhogSRf52mCzRw_4cfTPeta';

export const MEDIA_BUCKET = 'media';

// Played when there are no published music posts (or Supabase is down).
export const DEFAULT_TRACK = Object.freeze({
  id: 'default-track',
  title: 'gajówka',
  sc: 'https://soundcloud.com/bassvictimm/gajowka',
});

export const DEFAULT_VOLUME = 0.6;
