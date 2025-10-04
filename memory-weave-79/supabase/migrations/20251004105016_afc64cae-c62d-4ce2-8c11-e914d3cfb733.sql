-- Create storytellers table
CREATE TABLE public.storytellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create stories table (each conversation/memory)
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storyteller_id uuid REFERENCES public.storytellers(id) ON DELETE CASCADE NOT NULL,
  title text,
  status text DEFAULT 'in_progress' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create messages table (transcript)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  speaker text NOT NULL CHECK (speaker IN ('interviewer', 'storyteller')),
  content text NOT NULL,
  timestamp timestamptz DEFAULT now() NOT NULL
);

-- Create posts table (synthesized blog posts)
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  post_text text NOT NULL,
  pull_quotes jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  share_caption text,
  transcript_summary text,
  length_words integer,
  date_recorded date,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create shares table (for private links)
CREATE TABLE public.shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.storytellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public access for MVP - can be tightened later)
CREATE POLICY "Allow public read storytellers" ON public.storytellers FOR SELECT USING (true);
CREATE POLICY "Allow public insert storytellers" ON public.storytellers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update storytellers" ON public.storytellers FOR UPDATE USING (true);

CREATE POLICY "Allow public read stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Allow public insert stories" ON public.stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update stories" ON public.stories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete stories" ON public.stories FOR DELETE USING (true);

CREATE POLICY "Allow public read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert messages" ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Allow public insert posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete posts" ON public.posts FOR DELETE USING (true);

CREATE POLICY "Allow public read shares" ON public.shares FOR SELECT USING (true);
CREATE POLICY "Allow public insert shares" ON public.shares FOR INSERT WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create indexes for performance
CREATE INDEX idx_messages_story_id ON public.messages(story_id);
CREATE INDEX idx_posts_story_id ON public.posts(story_id);
CREATE INDEX idx_shares_token ON public.shares(token);