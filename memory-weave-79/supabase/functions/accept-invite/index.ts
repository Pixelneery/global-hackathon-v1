import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash function for tokens (SHA-256)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Hash the token to find the membership
    const tokenHash = await hashToken(token);

    // Find the membership with this token
    const { data: membership, error: findError } = await supabase
      .from('memberships')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .maybeSingle();

    if (findError) {
      console.error('Error finding membership:', findError);
      throw findError;
    }

    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invite token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token has expired
    if (membership.token_expires_at && new Date(membership.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invite token has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark membership as accepted
    const { error: updateError } = await supabase
      .from('memberships')
      .update({ 
        accepted_at: new Date().toISOString(),
        token_hash: null, // Clear the token after use
      })
      .eq('id', membership.id);

    if (updateError) {
      console.error('Error updating membership:', updateError);
      throw updateError;
    }

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        action: 'invite_accepted',
        target_type: 'membership',
        target_id: membership.id,
        metadata: { email: membership.user_email, role: membership.role },
      });

    // Redirect to the app with success message
    const redirectUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest', '')}/?invite_accepted=true&storyteller_id=${membership.storyteller_id}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('Error in accept-invite function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});