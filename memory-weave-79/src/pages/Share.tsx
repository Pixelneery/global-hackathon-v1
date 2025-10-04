import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  title: string;
  post_text: string;
  pull_quotes: any;
  tags: any;
  length_words: number;
  date_recorded: string;
}

const Share = () => {
  const { token } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedPost();
  }, [token]);

  const loadSharedPost = async () => {
    if (!token) return;

    // Get post ID from share token
    const { data: shareData, error: shareError } = await supabase
      .from('shares')
      .select('post_id')
      .eq('token', token)
      .single();

    if (shareError || !shareData) {
      console.error('Error loading share:', shareError);
      setLoading(false);
      return;
    }

    // Load post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', shareData.post_id)
      .single();

    if (postError) {
      console.error('Error loading post:', postError);
      setLoading(false);
      return;
    }

    setPost(postData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Memory Not Found</h2>
          <p className="text-muted-foreground">
            This shared memory link is invalid or has expired.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-semibold mb-0">Memory Keeper</h1>
          <p className="text-muted-foreground text-sm mt-2">A shared memory</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="space-y-8">
          <h1>{post.title}</h1>

          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span>{new Date(post.date_recorded).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <span>•</span>
            <span>{post.length_words} words</span>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-wrap text-lg leading-relaxed">
              {post.post_text}
            </p>
          </div>

          {post.pull_quotes && post.pull_quotes.length > 0 && (
            <Card className="bg-muted/30 border-l-4 border-primary p-8 my-8">
              {post.pull_quotes.map((quote, i) => (
                <blockquote key={i} className="text-xl italic mb-4 last:mb-0">
                  "{quote}"
                </blockquote>
              ))}
            </Card>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4">
              {post.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>

        <Card className="mt-12 p-8 bg-muted/20 text-center">
          <p className="text-muted-foreground">
            Create your own memory posts at{' '}
            <a href="/" className="text-primary hover:underline font-medium">
              Memory Keeper
            </a>
          </p>
        </Card>
      </main>
    </div>
  );
};

export default Share;
