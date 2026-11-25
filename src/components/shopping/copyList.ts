import { supabase } from "@/integrations/supabase/client";
import { prepareUniqueItems } from "@/utils/shoppingValidation";

interface CopyItem { name: string; quantity: number; category: string }

export const createListCopy = async (name: string, sourceItems: CopyItem[], userId: string) => {
  const { entries, duplicates, invalid } = prepareUniqueItems(sourceItems);
  const { data: newList, error: createError } = await supabase
    .from("shopping_lists").insert({ name, created_by: userId }).select().single();
  if (createError) throw createError;
  if (!newList) throw new Error("לא ניתן היה ליצור רשימה חדשה");
  try {
    if (entries.length) {
      const { error } = await supabase.from("shopping_items").insert(entries.map((item) => ({
        list_id: newList.id, name: item.name, quantity: item.quantity,
        category: item.category, completed: false, created_by: userId,
      })));
      if (error) throw error;
    }
  } catch (error) {
    // Only this newly created, unfinished copy is cleaned up. Never touch the source history.
    await supabase.from("shopping_items").delete().eq("list_id", newList.id);
    await supabase.from("shopping_lists").delete().eq("id", newList.id);
    throw error;
  }
  return { list: newList, added: entries.length, duplicates, invalid };
};