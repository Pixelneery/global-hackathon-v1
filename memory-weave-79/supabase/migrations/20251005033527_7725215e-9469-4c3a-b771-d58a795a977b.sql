-- Drop all existing public policies on stories table
DROP POLICY IF EXISTS "Allow public read stories" ON public.stories;
DROP POLICY IF EXISTS "Allow public insert stories" ON public.stories;
DROP POLICY IF EXISTS "Allow public update stories" ON public.stories;
DROP POLICY IF EXISTS "Allow public delete stories" ON public.stories;

-- Create restrictive SELECT policy: users can view stories from storytellers they have access to
CREATE POLICY "Users can view stories they have access to"
ON public.stories
FOR SELECT
TO authenticated
USING (
  public.can_access_storyteller(storyteller_id, auth.uid())
);

-- Create restrictive INSERT policy: authenticated users can create stories for storytellers they have access to
CREATE POLICY "Users can create stories for accessible storytellers"
ON public.stories
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_access_storyteller(storyteller_id, auth.uid())
);

-- Create restrictive UPDATE policy: only storyteller owners can update stories
CREATE POLICY "Owners can update their storyteller's stories"
ON public.stories
FOR UPDATE
TO authenticated
USING (
  public.get_storyteller_access_level(storyteller_id, auth.uid()) = 'owner'
)
WITH CHECK (
  public.get_storyteller_access_level(storyteller_id, auth.uid()) = 'owner'
);

-- Create restrictive DELETE policy: only storyteller owners can delete stories
CREATE POLICY "Owners can delete their storyteller's stories"
ON public.stories
FOR DELETE
TO authenticated
USING (
  public.get_storyteller_access_level(storyteller_id, auth.uid()) = 'owner'
);