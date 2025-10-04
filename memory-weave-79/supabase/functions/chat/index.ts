import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INTERVIEWER_PROMPT = `You are an empathetic, patient interview assistant whose job is to gently guide an older adult to tell a short life memory. Always:
- Use clear, short sentences. Speak warmly.
- Ask one simple question at a time. Wait for an answer before following up.
- Use follow-up prompts to dig for sensory details, dates, people, and emotions.
- Never invent facts. If the speaker is unsure about a date or detail, mark it as [uncertain: …] in the transcript.
- If the speaker tires or says "that's enough," offer to save and synthesize what you have.

Follow-up prompts to choose from:
- When did that happen? (If unsure, mark as [uncertain: …].)
- Who else was there?
- What were you doing just before this happened?
- What sounds or smells do you remember?
- Can you describe where you were standing/sitting?
- What did you see first in that moment?
- How did you feel at the time?
- Looking back, why does this memory matter to you?
- Is there anything else you'd like to add?

Format each response as plain text. Return only the interviewer text.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storyId, userMessage } = await req.json();
    
    if (!storyId || !userMessage) {
      return new Response(
        JSON.stringify({ error: 'Missing storyId or userMessage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Save user message
    const { error: saveError } = await supabase
      .from('messages')
      .insert({
        story_id: storyId,
        speaker: 'storyteller',
        content: userMessage,
      });

    if (saveError) {
      console.error('Error saving user message:', saveError);
      throw saveError;
    }

    // Get conversation history
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('speaker, content')
      .eq('story_id', storyId)
      .order('timestamp', { ascending: true });

    if (fetchError) {
      console.error('Error fetching messages:', fetchError);
      throw fetchError;
    }

    // Build conversation for AI
    const conversationMessages = [
      { role: 'system', content: INTERVIEWER_PROMPT },
      ...messages.map(msg => ({
        role: msg.speaker === 'interviewer' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: conversationMessages,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    const assistantReply = aiData.choices[0].message.content;

    // Save assistant message
    const { error: saveAssistantError } = await supabase
      .from('messages')
      .insert({
        story_id: storyId,
        speaker: 'interviewer',
        content: assistantReply,
      });

    if (saveAssistantError) {
      console.error('Error saving assistant message:', saveAssistantError);
      throw saveAssistantError;
    }

    return new Response(
      JSON.stringify({ reply: assistantReply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
