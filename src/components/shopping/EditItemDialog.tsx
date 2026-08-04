import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ShoppingItem } from "./types";
import { Label } from "../ui/label";

interface EditItemDialogProps {
  item: ShoppingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: ShoppingItem) => boolean | Promise<boolean>;
  categories: string[];
}

export const EditItemDialog = ({
  item,
  isOpen,
  onClose,
  onSave,
  categories,
}: EditItemDialogProps) => {
  const [editedItem, setEditedItem] = React.useState<ShoppingItem | null>(null);

  React.useEffect(() => {
    setEditedItem(item);
  }, [item]);

  if (!editedItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right font-display text-xl">עריכת פריט</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-right text-sm text-muted-foreground mr-1">שם המוצר</Label>
            <Input
              id="name"
              value={editedItem.name}
              onChange={(e) =>
                setEditedItem({ ...editedItem, name: e.target.value })
              }
              className="text-right h-12 rounded-xl text-[16px]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="quantity" className="text-right text-sm text-muted-foreground mr-1">כמות</Label>
            <Input
              id="quantity"
              type="number"
              value={editedItem.quantity}
              onChange={(e) =>
                setEditedItem({
                  ...editedItem,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              className="text-right h-12 rounded-xl text-[16px]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category" className="text-right text-sm text-muted-foreground mr-1">קטגוריה</Label>
            <Select
              value={editedItem.category}
              onValueChange={(value) =>
                setEditedItem({ ...editedItem, category: value })
              }
            >
              <SelectTrigger className="text-right h-12 rounded-xl text-[16px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-right">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex flex-row gap-3 sm:justify-start">
          <Button
            type="submit"
            size="lg"
            className="flex-1 rounded-xl h-12 font-bold"
            disabled={!editedItem.name.trim() || editedItem.quantity < 1}
            onClick={async () => {
              const saved = await onSave(editedItem);
              if (saved) onClose();
            }}
          >
            שמור שינויים
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-xl h-12 font-bold"
            onClick={onClose}
          >
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
