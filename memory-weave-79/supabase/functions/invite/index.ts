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

// Generate secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storytellerId, email, role = 'viewer' } = await req.json();
    
    if (!storytellerId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing storytellerId or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be owner, editor, or viewer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Generate secure token
    const token = generateToken();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Check if membership already exists
    const { data: existing } = await supabase
      .from('memberships')
      .select('id')
      .eq('storyteller_id', storytellerId)
      .eq('user_email', email)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'User already invited or is a member' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create membership invite
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .insert({
        storyteller_id: storytellerId,
        user_email: email,
        role: role,
        token_hash: tokenHash,
        token_expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      throw membershipError;
    }

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        action: 'invite_created',
        target_type: 'membership',
        target_id: membership.id,
        metadata: { storyteller_id: storytellerId, email, role },
      });

    // Generate invite URL
    const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest', '')}/functions/v1/accept-invite?token=${token}`;

    return new Response(
      JSON.stringify({ 
        membership,
        inviteUrl,
        message: 'Invite created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in invite function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});