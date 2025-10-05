import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareId } = await req.json();
    
    if (!shareId) {
      return new Response(
        JSON.stringify({ error: 'Missing shareId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Revoke the share
    const { error: revokeError } = await supabase
      .from('shares')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', shareId);

    if (revokeError) {
      console.error('Error revoking share:', revokeError);
      throw revokeError;
    }

    // Log audit event
    await supabase
      .from('audit_logs')
      .insert({
        action: 'share_revoked',
        target_type: 'share',
        target_id: shareId,
      });

    return new Response(
      JSON.stringify({ message: 'Share revoked successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in revoke-share function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});