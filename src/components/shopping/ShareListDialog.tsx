import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Share } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface ShareListDialogProps {
  listId: string;
}

export const ShareListDialog = ({ listId }: ShareListDialogProps) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleShare = async () => {
    if (!user) return;

    try {
      // First get the user id from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', email)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        toast({
          title: "משתמש לא נמצא",
          description: "לא נמצא משתמש עם האימייל שהוזן. אנא ודא שהמשתמש נרשם למערכת",
          variant: "destructive",
        });
        return;
      }

      // Check if the list is already shared with this user
      const { data: existingShare } = await supabase
        .from('list_shares')
        .select('id')
        .eq('list_id', listId)
        .eq('shared_with', profile.id)
        .maybeSingle();

      if (existingShare) {
        toast({
          title: "הרשימה כבר משותפת",
          description: `הרשימה כבר משותפת עם ${email}`,
          variant: "destructive",
        });
        return;
      }

      // Then create the share
      const { error: shareError } = await supabase
        .from('list_shares')
        .insert({
          list_id: listId,
          shared_with: profile.id,
          permission: permission,
          created_by: user.id
        });

      if (shareError) throw shareError;

      toast({
        title: "הרשימה שותפה בהצלחה",
        description: `הרשימה שותפה עם ${email}`,
      });
      setEmail("");
      setIsOpen(false);
    } catch (error) {
      console.error('Error sharing list:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לשתף את הרשימה",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share size={16} />
          שתף רשימה
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>שתף רשימת קניות</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">אימייל המשתמש</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="הזן אימייל"
              className="text-right"
            />
          </div>
          <div className="grid gap-2">
            <Label>הרשאות</Label>
            <RadioGroup
              value={permission}
              onValueChange={(value) => setPermission(value as 'view' | 'edit')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="view" id="view" />
                <Label htmlFor="view">צפייה בלבד</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="edit" id="edit" />
                <Label htmlFor="edit">עריכה</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <Button onClick={handleShare} disabled={!email}>שתף</Button>
      </DialogContent>
    </Dialog>
  );
};