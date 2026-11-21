-- Music playlist: songs become posts of type 'music' with an audio file.
-- The public sidebar player plays every published music post, newest first.
begin;

alter table public.posts add column if not exists audio_url text;

-- Carry over the old single background track (settings key 'music')
-- as the first playlist entry, so the site doesn't go silent.
insert into public.posts (title, type, body, img_url, audio_url, likes, published)
select coalesce(nullif(s.value::json->>'title', ''), 'untitled track'),
       'music', '', null, s.value::json->>'url', 0, true
from public.settings s
where s.key = 'music'
  and coalesce(s.value::json->>'url', '') <> ''
  and not exists (
    select 1 from public.posts p where p.audio_url = s.value::json->>'url'
  );

commit;
