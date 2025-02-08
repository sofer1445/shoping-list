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

interface EditItemDialogProps {
  item: ShoppingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: ShoppingItem) => void;
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-right">עריכת פריט</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-right">שם המוצר</label>
            <Input
              id="name"
              value={editedItem.name}
              onChange={(e) =>
                setEditedItem({ ...editedItem, name: e.target.value })
              }
              className="text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="quantity" className="text-right">כמות</label>
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
              className="text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="category" className="text-right">קטגוריה</label>
            <Select
              value={editedItem.category}
              onValueChange={(value) =>
                setEditedItem({ ...editedItem, category: value })
              }
            >
              <SelectTrigger className="text-right">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            type="submit"
            onClick={() => {
              onSave(editedItem);
              onClose();
            }}
          >
            שמור שינויים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};