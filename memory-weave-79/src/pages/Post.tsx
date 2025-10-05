import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Download, Share2, Edit2, Save, X, Users, UserPlus } from "lucide-react";
import { ShareDialog } from "@/components/ShareDialog";
import { InviteMemberDialog } from "@/components/InviteMemberDialog";
import { MembershipsDialog } from "@/components/MembershipsDialog";

interface Post {
  id: string;
  title: string;
  post_text: string;
  pull_quotes: any;
  tags: any;
  share_caption: string;
  transcript_summary: string;
  length_words: number;
  date_recorded: string;
}

const Post = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedPost, setEditedPost] = useState("");
  const [storytellerId, setStorytellerId] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    if (!postId) return;

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*, story:stories(storyteller_id)')
      .eq('id', postId)
      .single();

    if (postError) {
      console.error('Error loading post:', postError);
      toast.error('Failed to load post');
      return;
    }

    setPost(postData);
    setEditedTitle(postData.title);
    setEditedPost(postData.post_text);
    if (postData.story) {
      setStorytellerId((postData.story as any).storyteller_id);
    }
    setLoading(false);
  };

  const saveEdits = async () => {
    if (!postId || !post) return;

    const { error } = await supabase
      .from('posts')
      .update({
        title: editedTitle,
        post_text: editedPost,
      })
      .eq('id', postId);

    if (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
      return;
    }

    setPost({ ...post, title: editedTitle, post_text: editedPost });
    setEditing(false);
    toast.success('Changes saved!');
  };


  const exportPDF = () => {
    if (!post) return;
    
    // Simple text export (in production, use a PDF library like jsPDF)
    const text = `${post.title}\n\n${post.post_text}\n\nWritten on: ${post.date_recorded}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.title.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Post downloaded!');
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
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Post not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>

          <div className="flex gap-2">
            {editing ? (
              <>
                <Button onClick={saveEdits} size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setEditing(false);
                    setEditedTitle(post.title);
                    setEditedPost(post.post_text);
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                {storytellerId && (
                  <>
                    <Button onClick={() => setShowMembersDialog(true)} variant="outline" size="sm" className="gap-2">
                      <Users className="h-4 w-4" />
                      Members
                    </Button>
                    <Button onClick={() => setShowInviteDialog(true)} variant="outline" size="sm" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Invite
                    </Button>
                  </>
                )}
                <Button onClick={() => setShowShareDialog(true)} size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="space-y-8">
          {editing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-4xl font-bold h-auto py-4 border-2"
            />
          ) : (
            <h1>{post.title}</h1>
          )}

          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span>{new Date(post.date_recorded).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <span>•</span>
            <span>{post.length_words} words</span>
          </div>

          {editing ? (
            <Textarea
              value={editedPost}
              onChange={(e) => setEditedPost(e.target.value)}
              className="min-h-[400px] text-lg leading-relaxed border-2"
            />
          ) : (
            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-wrap text-lg leading-relaxed">
                {post.post_text}
              </p>
            </div>
          )}

          {!editing && post.pull_quotes && post.pull_quotes.length > 0 && (
            <Card className="bg-muted/30 border-l-4 border-primary p-8 my-8">
              {post.pull_quotes.map((quote, i) => (
                <blockquote key={i} className="text-xl italic mb-4 last:mb-0">
                  "{quote}"
                </blockquote>
              ))}
            </Card>
          )}

          {!editing && post.tags && post.tags.length > 0 && (
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

      </main>

      {postId && (
        <>
          <ShareDialog 
            open={showShareDialog} 
            onOpenChange={setShowShareDialog} 
            postId={postId} 
          />
          {storytellerId && (
            <>
              <InviteMemberDialog
                open={showInviteDialog}
                onOpenChange={setShowInviteDialog}
                storytellerId={storytellerId}
              />
              <MembershipsDialog
                open={showMembersDialog}
                onOpenChange={setShowMembersDialog}
                storytellerId={storytellerId}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Post;
