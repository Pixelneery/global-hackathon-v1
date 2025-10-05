-- Drop all existing public policies on storytellers table
DROP POLICY IF EXISTS "Allow public insert storytellers" ON public.storytellers;
DROP POLICY IF EXISTS "Allow public read storytellers" ON public.storytellers;
DROP POLICY IF EXISTS "Allow public update storytellers" ON public.storytellers;

-- Create restrictive SELECT policy: users can view storytellers they own or are members of
CREATE POLICY "Users can view storytellers they have access to"
ON public.storytellers
FOR SELECT
TO authenticated
USING (
  public.can_access_storyteller(id, auth.uid())
);

-- Create restrictive INSERT policy: authenticated users can create storytellers and become the owner
CREATE POLICY "Authenticated users can create storytellers"
ON public.storytellers
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid()
);

-- Create restrictive UPDATE policy: only owners can update their storytellers
CREATE POLICY "Owners can update their storytellers"
ON public.storytellers
FOR UPDATE
TO authenticated
USING (
  public.get_storyteller_access_level(id, auth.uid()) = 'owner'
)
WITH CHECK (
  public.get_storyteller_access_level(id, auth.uid()) = 'owner'
);

-- Create restrictive DELETE policy: only owners can delete their storytellers
CREATE POLICY "Owners can delete their storytellers"
ON public.storytellers
FOR DELETE
TO authenticated
USING (
  public.get_storyteller_access_level(id, auth.uid()) = 'owner'
);