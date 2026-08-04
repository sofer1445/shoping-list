import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Share, UserPlus } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface ShareListDialogProps {
  listId: string;
}

export const ShareListDialog = ({ listId }: ShareListDialogProps) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<'view' | 'edit'>('edit');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleShare = async () => {
    if (!user) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', email)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast({
          title: "משתמש לא נמצא",
          description: "לא נמצא משתמש עם האימייל שהוזן.",
          variant: "destructive",
        });
        return;
      }

      const { data: existingShare } = await supabase
        .from('list_shares')
        .select('id')
        .eq('list_id', listId)
        .eq('shared_with', profile.id)
        .maybeSingle();

      if (existingShare) {
        toast({
          title: "כבר משותף",
          description: "הרשימה כבר משותפת עם משתמש זה",
          variant: "destructive",
        });
        return;
      }

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
        title: "שותף בהצלחה",
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
        <Button variant="outline" size="sm" className="h-8 rounded-full gap-2 text-[11px] font-bold px-3">
          <Share size={14} />
          שתף
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right font-display text-lg">שתף רשימה</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-right text-muted-foreground mr-1 text-xs">אימייל המשתמש</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="text-right h-12 rounded-xl"
            />
          </div>
          <div className="grid gap-3">
            <Label className="text-right text-muted-foreground mr-1 text-xs">הרשאות</Label>
            <RadioGroup
              value={permission}
              onValueChange={(value) => setPermission(value as 'view' | 'edit')}
              className="flex flex-row-reverse justify-end gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="view" id="view" />
                <Label htmlFor="view" className="font-medium">צפייה בלבד</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="edit" id="edit" />
                <Label htmlFor="edit" className="font-medium">עריכה</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <Button 
          onClick={handleShare} 
          disabled={!email} 
          className="w-full h-12 rounded-xl font-bold gap-2"
        >
          <UserPlus size={18} />
          שלח הזמנה
        </Button>
      </DialogContent>
    </Dialog>
  );
};
