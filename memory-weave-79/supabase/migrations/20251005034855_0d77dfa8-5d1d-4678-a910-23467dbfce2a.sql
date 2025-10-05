-- Drop all existing public policies on messages table
DROP POLICY IF EXISTS "Allow public read messages" ON public.messages;
DROP POLICY IF EXISTS "Allow public insert messages" ON public.messages;

-- Create restrictive SELECT policy: users can view messages for stories they have access to
CREATE POLICY "Users can view messages for accessible stories"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = messages.story_id
    AND public.can_access_storyteller(stories.storyteller_id, auth.uid())
  )
);

-- Create restrictive INSERT policy: users can create messages for stories they have access to
CREATE POLICY "Users can create messages for accessible stories"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = messages.story_id
    AND public.can_access_storyteller(stories.storyteller_id, auth.uid())
  )
);