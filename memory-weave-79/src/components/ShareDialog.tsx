import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

export function ShareDialog({ open, onOpenChange, postId }: ShareDialogProps) {
  const [expiry, setExpiry] = useState("7");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createShareLink = async () => {
    setLoading(true);

    try {
      const expiryDays = parseInt(expiry);
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('shares')
        .insert({ 
          post_id: postId,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/share/${data.token}`;
      setShareUrl(url);
      setShareId(data.id);
      navigator.clipboard.writeText(url);
      toast.success('Share link created and copied to clipboard!');
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async () => {
    if (!shareId) return;

    try {
      const { error } = await supabase.functions.invoke('revoke-share', {
        body: { shareId }
      });

      if (error) throw error;

      toast.success('Share link revoked');
      setShareUrl(null);
      setShareId(null);
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('Failed to revoke share link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this Memory</DialogTitle>
          <DialogDescription>
            Create a secure, expiring link to share this post with family.
          </DialogDescription>
        </DialogHeader>
        
        {!shareUrl ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Link expires in</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id="expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={createShareLink} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Share Link'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success('Link copied!');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link will expire in {expiry} day{expiry !== "1" ? "s" : ""}
              </p>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="destructive" onClick={revokeShare} className="w-full gap-2">
                <Trash2 className="h-4 w-4" />
                Revoke Link
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}