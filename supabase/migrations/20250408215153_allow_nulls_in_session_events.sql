alter table public.user_session_events
  alter column user_answer drop not null;

alter table public.user_session_events
  alter column mark_data drop not null;

-- Also allow null for is_correct, as it won't be set initially
alter table public.user_session_events
  alter column is_correct drop not null;
