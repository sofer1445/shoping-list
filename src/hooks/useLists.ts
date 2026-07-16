import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export interface ListParticipant {
  id: string;
  name: string;
  initial: string;
  is_owner: boolean;
}

export interface ListSummary {
  id: string;
  name: string;
  created_by: string;
  updated_at: string;
  is_owner: boolean;
  owner_name: string | null;
  permission: "view" | "edit" | "owner";
  total: number;
  completed: number;
  participants: number;
  members: ListParticipant[];
}

export const useLists = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // own lists
      const { data: own } = await supabase
        .from("shopping_lists")
        .select("id, name, created_by, created_at")
        .eq("created_by", user.id)
        .eq("archived", false);

      // lists shared with me
      const { data: sharesIn } = await supabase
        .from("list_shares")
        .select("permission, list_id, shopping_lists!inner(id, name, created_by, archived)")
        .eq("shared_with", user.id);

      const sharedRows =
        (sharesIn || [])
          .filter((r: any) => r.shopping_lists && !r.shopping_lists.archived)
          .map((r: any) => ({
            id: r.shopping_lists.id,
            name: r.shopping_lists.name,
            created_by: r.shopping_lists.created_by,
            permission: r.permission as "view" | "edit",
          })) || [];

      const allIds = Array.from(
        new Set([...(own || []).map((l) => l.id), ...sharedRows.map((l) => l.id)])
      );

      if (allIds.length === 0) {
        setLists([]);
        return;
      }

      // items counts + last activity per list
      const { data: items } = await supabase
        .from("shopping_items")
        .select("list_id, completed, created_at, completed_at, created_by")
        .in("list_id", allIds)
        .eq("archived", false);

      // owner profiles
      const ownerIds = Array.from(new Set(sharedRows.map((r) => r.created_by)));
      const { data: profiles } = ownerIds.length
        ? await supabase.from("profiles").select("id, username").in("id", ownerIds)
        : { data: [] as any[] };
      const nameOf = (id: string) =>
        profiles?.find((p: any) => p.id === id)?.username || null;

      // participants per list
      const { data: allShares } = await supabase
        .from("list_shares")
        .select("list_id, shared_with")
        .in("list_id", allIds);

      // resolve names for all members (owners + sharees) across lists
      const memberIds = new Set<string>();
      allIds.forEach((id) => {
        const src = (own || []).find((l) => l.id === id) || sharedRows.find((l) => l.id === id);
        if (src) memberIds.add((src as any).created_by);
      });
      (allShares || []).forEach((s) => memberIds.add(s.shared_with));
      const { data: memberProfs } = memberIds.size
        ? await supabase.from("profiles").select("id, username").in("id", Array.from(memberIds))
        : { data: [] as any[] };
      const memberName = (id: string) => {
        const raw = memberProfs?.find((p: any) => p.id === id)?.username || "";
        const base = raw.includes("@") ? raw.split("@")[0] : raw;
        return base || "משתמש";
      };

      const summary: ListSummary[] = [];

      for (const id of allIds) {
        const ownRow = (own || []).find((l) => l.id === id);
        const sharedRow = sharedRows.find((l) => l.id === id);
        const source = ownRow || sharedRow;
        if (!source) continue;

        const listItems = (items || []).filter((i) => i.list_id === id);
        const total = listItems.length;
        const completed = listItems.filter((i) => i.completed).length;
        const lastActivity = listItems.reduce((max, i) => {
          const t = i.completed_at || i.created_at;
          return t && t > max ? t : max;
        }, (ownRow as any)?.created_at || "1970-01-01");

        const ownerId = (source as any).created_by as string;
        const sharees = (allShares || []).filter((s) => s.list_id === id);
        const members: ListParticipant[] = [
          {
            id: ownerId,
            name: memberName(ownerId),
            initial: memberName(ownerId).slice(0, 1).toUpperCase(),
            is_owner: true,
          },
          ...sharees.map((s) => ({
            id: s.shared_with,
            name: memberName(s.shared_with),
            initial: memberName(s.shared_with).slice(0, 1).toUpperCase(),
            is_owner: false,
          })),
        ];

        summary.push({
          id,
          name: (source as any).name,
          created_by: ownerId,
          updated_at: lastActivity,
          is_owner: !!ownRow,
          owner_name: ownRow ? null : memberName(ownerId),
          permission: ownRow ? "owner" : ((sharedRow as any).permission as "view" | "edit"),
          total,
          completed,
          participants: members.length,
          members,
        });
      }

      summary.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
      setLists(summary);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    const handler = () => fetch();
    window.addEventListener("shopping-list-updated", handler);
    return () => window.removeEventListener("shopping-list-updated", handler);
  }, [fetch]);

  return { lists, isLoading, refetch: fetch };
};
