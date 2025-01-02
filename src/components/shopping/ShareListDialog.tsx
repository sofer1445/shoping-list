import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Share } from "lucide-react";

interface ShareListDialogProps {
  onShare: (email: string, permission: 'view' | 'edit') => Promise<void>;
}

export const ShareListDialog = ({ onShare }: ShareListDialogProps) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = async () => {
    await onShare(email, permission);
    setEmail("");
    setIsOpen(false);
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