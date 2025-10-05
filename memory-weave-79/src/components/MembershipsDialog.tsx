import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Membership {
  id: string;
  user_email: string;
  role: string;
  invited_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

interface MembershipsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storytellerId: string;
}

export function MembershipsDialog({ open, onOpenChange, storytellerId }: MembershipsDialogProps) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadMemberships();
    }
  }, [open, storytellerId]);

  const loadMemberships = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('storyteller_id', storytellerId)
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error loading memberships:', error);
      toast.error('Failed to load members');
    } else {
      setMemberships(data || []);
    }
    setLoading(false);
  };

  const revokeMembership = async (membershipId: string) => {
    const { error } = await supabase
      .from('memberships')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', membershipId);

    if (error) {
      console.error('Error revoking membership:', error);
      toast.error('Failed to revoke membership');
    } else {
      toast.success('Membership revoked');
      loadMemberships();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Family Members</DialogTitle>
          <DialogDescription>
            Manage who has access to this storyteller's memories.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : memberships.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No members yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {memberships.map((membership) => (
              <div
                key={membership.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{membership.user_email}</span>
                    <Badge variant={membership.role === 'owner' ? 'default' : 'secondary'}>
                      {membership.role}
                    </Badge>
                    {membership.accepted_at ? (
                      <Badge variant="outline" className="text-xs">Accepted</Badge>
                    ) : membership.revoked_at ? (
                      <Badge variant="outline" className="text-xs">Revoked</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Invited {new Date(membership.invited_at).toLocaleDateString()}
                  </p>
                </div>
                {!membership.revoked_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeMembership(membership.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}