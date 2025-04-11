-- Create user_learning_sessions table to store learning sessions
CREATE TABLE IF NOT EXISTS public.user_learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  target_language TEXT NOT NULL,
  source_language TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_learning_sessions_user_id ON public.user_learning_sessions(user_id);

-- Create RLS policies for user_learning_sessions
ALTER TABLE public.user_learning_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to view and create their own sessions
CREATE POLICY "Users can view their own sessions" 
  ON public.user_learning_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
  ON public.user_learning_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
  ON public.user_learning_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create user_session_events table to store learning events
CREATE TABLE IF NOT EXISTS public.user_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.user_learning_sessions(id) ON DELETE CASCADE,
  submodule_id TEXT NOT NULL,
  modal_id TEXT NOT NULL,
  flavour_id TEXT,
  question_data JSONB NOT NULL,
  user_answer JSONB NOT NULL,
  mark_data JSONB,
  is_correct BOOLEAN,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster lookup by session_id
CREATE INDEX IF NOT EXISTS idx_user_session_events_session_id ON public.user_session_events(session_id);

-- Create RLS policies for user_session_events
ALTER TABLE public.user_session_events ENABLE ROW LEVEL SECURITY;

-- Allow users to view and create events for their own sessions
CREATE POLICY "Users can view events for their own sessions" 
  ON public.user_session_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_learning_sessions
      WHERE id = user_session_events.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events for their own sessions" 
  ON public.user_session_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_learning_sessions
      WHERE id = user_session_events.session_id
      AND user_id = auth.uid()
    )
  );

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.user_learning_sessions TO authenticated;
GRANT SELECT, INSERT ON public.user_session_events TO authenticated; 