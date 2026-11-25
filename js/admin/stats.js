// Stats tab: page views from the page_visits table.
import { $ } from '../core/dom.js';
import { sb } from '../core/supabase.js';
import { toast } from './ui.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function count(filter = (q) => q) {
  const { count, error } = await filter(
    sb.from('page_visits').select('*', { count: 'exact', head: true }),
  );
  if (error) throw error;
  return count ?? 0;
}

// Supabase's JS client has no COUNT(DISTINCT), so this pulls visitor ids and
// dedupes here. Fine at a personal site's volume; if it ever gets slow, move
// it into a Postgres function that does count(distinct visitor_id).
async function uniqueVisitors() {
  const { data, error } = await sb.from('page_visits').select('visitor_id').limit(20000);
  if (error) throw error;
  return new Set((data || []).map((r) => r.visitor_id)).size;
}

export async function loadStats() {
  const ids = ['#stat-total', '#stat-unique', '#stat-week'];
  ids.forEach((id) => ($(id).textContent = '…'));
  try {
    const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();
    const [total, unique, week] = await Promise.all([
      count(),
      uniqueVisitors(),
      count((q) => q.gte('created_at', weekAgo)),
    ]);
    $('#stat-total').textContent = total.toLocaleString();
    $('#stat-unique').textContent = unique.toLocaleString();
    $('#stat-week').textContent = week.toLocaleString();
  } catch (err) {
    ids.forEach((id) => ($(id).textContent = '—'));
    toast(err.message || 'Stats failed to load');
  }
}
