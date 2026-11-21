// Records one page view per load for the admin Stats tab.
// The visitor id is a random UUID kept in this browser — no personal data.
import { SUPABASE_URL, SUPABASE_KEY } from '../core/config.js';

export function trackVisit() {
  let vid;
  try {
    vid = localStorage.getItem('pg_vid');
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem('pg_vid', vid);
    }
  } catch {
    return; // storage blocked — skip rather than count every load as new
  }

  fetch(SUPABASE_URL + '/rest/v1/page_visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
    },
    body: JSON.stringify({ visitor_id: vid, path: location.pathname }),
  }).catch(() => {
    /* never break the site over analytics */
  });
}
