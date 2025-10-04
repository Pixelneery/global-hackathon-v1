import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  speaker: string;
  content: string;
  timestamp: string;
}

const Chat = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!storyId) return;

    loadMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `story_id=eq.${storyId}`
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!storyId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('story_id', storyId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || !storyId || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { storyId, userMessage }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const synthesizeStory = async () => {
    if (!storyId || synthesizing) return;

    setSynthesizing(true);
    toast.info('Creating your memory post...');

    try {
      const { data, error } = await supabase.functions.invoke('synthesize', {
        body: { storyId }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Memory post created!');
      navigate(`/post/${data.post.id}`);
    } catch (error) {
      console.error('Error synthesizing:', error);
      toast.error('Failed to create memory post');
    } finally {
      setSynthesizing(false);
    }
  };

  const hasEnoughMessages = messages.filter(m => m.speaker === 'storyteller').length >= 2;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
          <h1 className="text-xl font-semibold mb-0">Your Memory</h1>
          <Button
            onClick={synthesizeStory}
            disabled={!hasEnoughMessages || synthesizing}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {synthesizing ? 'Creating...' : 'Create Post'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6 mb-24">
          {messages.length === 0 && (
            <Card className="p-8 text-center bg-muted/30">
              <h2 className="text-xl font-medium mb-3">Welcome!</h2>
              <p className="text-muted-foreground">
                I'm here to help you capture a precious memory. We'll take it slowly. 
                Start by telling me your name and a bit about a memory you'd like to share.
              </p>
            </Card>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.speaker === 'storyteller' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`p-4 max-w-[85%] ${
                  message.speaker === 'storyteller'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </Card>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <Card className="p-4 max-w-[85%] bg-card">
                <p className="text-muted-foreground italic">Thinking...</p>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="container mx-auto max-w-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share your memory..."
                disabled={loading}
                className="flex-1 text-base h-12"
              />
              <Button type="submit" disabled={loading || !input.trim()} size="lg">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
