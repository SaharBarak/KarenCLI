-- Create github_connections table
CREATE TABLE IF NOT EXISTS public.github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  github_id TEXT NOT NULL,
  github_username TEXT NOT NULL,
  access_token TEXT NOT NULL, -- In production, encrypt this
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own GitHub connection"
  ON public.github_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own GitHub connection"
  ON public.github_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GitHub connection"
  ON public.github_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own GitHub connection"
  ON public.github_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_github_connections_updated_at
  BEFORE UPDATE ON public.github_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on user_id
CREATE INDEX idx_github_connections_user_id ON public.github_connections(user_id);
