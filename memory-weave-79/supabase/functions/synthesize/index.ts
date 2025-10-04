import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYNTHESIS_PROMPT = `You are an empathetic editor. Input: a conversation transcript between an interviewer and an older adult. Produce the following JSON object only (no extra commentary).

Required JSON fields:
- title: short headline (max 8 words).
- date_recorded: YYYY-MM-DD (use today's date).
- storyteller_name: string.
- length_words: integer (word count of the blog post).
- post: a warm, readable blog post of ~300–450 words in the storyteller's voice (first or third person as preferred). Remove fillers like 'um', 'uh' but do not invent facts. If a fact is uncertain in the transcript, include it with a bracketed note like '[uncertain: ~1952]'.
- pull_quotes: array of two short quotes (each 8–14 words).
- share_caption: one-sentence share caption (max 25 words).
- tags: array of 3 tags.
- transcript_summary: one-sentence summary (20–25 words).

Formatting & style rules:
1. DO NOT invent new people, places, or dates. Mark uncertainty with [uncertain: …].
2. Preserve emotional tone; maintain humor or solemnity as appropriate.
3. Include 1–2 sensory details and 1 reflective sentence on why memory matters.
4. Word count target: 300–450 words. Provide exact length_words.
Output only valid JSON.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storyId } = await req.json();
    
    if (!storyId) {
      return new Response(
        JSON.stringify({ error: 'Missing storyId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get conversation transcript
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('speaker, content, timestamp')
      .eq('story_id', storyId)
      .order('timestamp', { ascending: true });

    if (fetchError || !messages || messages.length === 0) {
      console.error('Error fetching messages:', fetchError);
      throw new Error('No messages found for this story');
    }

    // Format transcript
    const transcript = messages
      .map(msg => `${msg.speaker === 'interviewer' ? 'Interviewer' : 'Storyteller'}: ${msg.content}`)
      .join('\n\n');

    // Call Lovable AI with tool calling for structured output
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
        messages: [
          { role: 'system', content: SYNTHESIS_PROMPT },
          { role: 'user', content: `Here is the transcript:\n\n${transcript}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_memory_post',
              description: 'Create a structured blog post from a memory transcript',
              parameters: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Short headline (max 8 words)' },
                  date_recorded: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                  storyteller_name: { type: 'string' },
                  length_words: { type: 'integer', description: 'Word count of post' },
                  post: { type: 'string', description: 'Blog post content (300-450 words)' },
                  pull_quotes: { 
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Two short quotes (8-14 words each)'
                  },
                  share_caption: { type: 'string', description: 'One-sentence caption (max 25 words)' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '3 relevant tags'
                  },
                  transcript_summary: { type: 'string', description: 'One-sentence summary (20-25 words)' }
                },
                required: ['title', 'date_recorded', 'storyteller_name', 'length_words', 'post', 'pull_quotes', 'share_caption', 'tags', 'transcript_summary'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_memory_post' } },
        temperature: 0.3,
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
    console.log('AI Response:', JSON.stringify(aiData, null, 2));
    
    // Extract tool call result
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'create_memory_post') {
      throw new Error('AI did not return expected tool call');
    }

    const synthesizedData = JSON.parse(toolCall.function.arguments);

    // Save post to database
    const { data: post, error: saveError } = await supabase
      .from('posts')
      .insert({
        story_id: storyId,
        title: synthesizedData.title,
        post_text: synthesizedData.post,
        pull_quotes: synthesizedData.pull_quotes,
        tags: synthesizedData.tags,
        share_caption: synthesizedData.share_caption,
        transcript_summary: synthesizedData.transcript_summary,
        length_words: synthesizedData.length_words,
        date_recorded: synthesizedData.date_recorded,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving post:', saveError);
      throw saveError;
    }

    // Update story status
    await supabase
      .from('stories')
      .update({ status: 'completed', title: synthesizedData.title })
      .eq('id', storyId);

    return new Response(
      JSON.stringify({ post, synthesizedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in synthesize function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
