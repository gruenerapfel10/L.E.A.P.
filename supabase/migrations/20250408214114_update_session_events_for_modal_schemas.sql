alter table public.user_session_events
  add column modal_schema_id text;

alter table public.user_session_events
  drop column if exists modal_id;

alter table public.user_session_events
  drop column if exists flavour_id;
