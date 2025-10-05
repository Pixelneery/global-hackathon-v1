import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, BookOpen, Heart, LogOut } from "lucide-react";

interface Story {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading stories:', error);
      return;
    }

    setStories(data || []);
  };

  const createNewStory = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Create storyteller
      const { data: storyteller, error: storytellerError } = await supabase
        .from('storytellers')
        .insert({ name: name.trim(), owner_id: user.id })
        .select()
        .single();

      if (storytellerError) throw storytellerError;

      // Create story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({ 
          storyteller_id: storyteller.id,
          status: 'in_progress'
        })
        .select()
        .single();

      if (storyError) throw storyError;

      toast.success('Let\'s begin your memory!');
      navigate(`/chat/${story.id}`);
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl mb-0">StoryNest</h1>
            </div>
            <div className="flex-1 flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center">
            Preserve your precious memories through guided conversations. 
            Share your stories with family for generations to come.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {!showCreate ? (
          <div className="space-y-8">
            <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-semibold mb-4">Start Capturing Memories</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Our gentle AI interviewer will guide you through sharing a cherished memory. 
                Take your time—there's no rush.
              </p>
              <Button size="lg" onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="h-5 w-5" />
                Begin New Memory
              </Button>
            </Card>

            {stories.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Your Memories</h2>
                <div className="grid gap-4">
                  {stories.map((story) => (
                    <Card
                      key={story.id}
                      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        if (story.status === 'completed') {
                          // Find the post for this story
                          supabase
                            .from('posts')
                            .select('id')
                            .eq('story_id', story.id)
                            .single()
                            .then(({ data }) => {
                              if (data) navigate(`/post/${data.id}`);
                            });
                        } else {
                          navigate(`/chat/${story.id}`);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {story.title || 'Untitled Memory'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(story.created_at).toLocaleDateString()} • {story.status === 'completed' ? 'Completed' : 'In Progress'}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          {story.status === 'completed' ? 'View' : 'Continue'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">Tell Us Your Name</h2>
            <p className="text-muted-foreground mb-6 text-center">
              We'll use this to personalize your memory-keeping experience.
            </p>
            <div className="space-y-4">
              <Input
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createNewStory()}
                className="text-lg h-12"
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createNewStory}
                  className="flex-1"
                  disabled={loading || !name.trim()}
                >
                  {loading ? 'Starting...' : 'Continue'}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </main>

      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Your memories are private and secure. Only you can share them.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
