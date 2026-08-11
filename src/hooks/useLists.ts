import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const loadLists = async (userId: string): Promise<ListSummary[]> => {
  // own lists + lists shared with me (parallel)
  const [{ data: own, error: ownError }, { data: sharesIn, error: sharesError }] =
    await Promise.all([
      supabase
        .from("shopping_lists")
        .select("id, name, created_by, created_at")
        .eq("created_by", userId)
        .eq("archived", false),
      supabase
        .from("list_shares")
        .select(
          "permission, list_id, shopping_lists!list_shares_list_id_fkey!inner(id, name, created_by, archived)"
        )
        .eq("shared_with", userId),
    ]);

  if (ownError || sharesError) throw ownError || sharesError;

  const sharedRows = (sharesIn || [])
    .filter((r: any) => r.shopping_lists && !r.shopping_lists.archived)
    .map((r: any) => ({
      id: r.shopping_lists.id,
      name: r.shopping_lists.name,
      created_by: r.shopping_lists.created_by,
      permission: r.permission as "view" | "edit",
    }));

  const allIds = Array.from(
    new Set([...(own || []).map((l) => l.id), ...sharedRows.map((l) => l.id)])
  );

  if (allIds.length === 0) return [];

  // items counts + participants (parallel)
  const [{ data: items }, { data: allShares }] = await Promise.all([
    supabase
      .from("shopping_items")
      .select("list_id, completed, created_at, completed_at, created_by")
      .in("list_id", allIds)
      .eq("archived", false),
    supabase.from("list_shares").select("list_id, shared_with").in("list_id", allIds),
  ]);

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
  return summary;
};

export const useLists = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["lists", user?.id],
    queryFn: () => loadLists(user!.id),
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["lists", user?.id] });
  }, [queryClient, user?.id]);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("shopping-list-updated", handler);
    return () => window.removeEventListener("shopping-list-updated", handler);
  }, [refetch]);

  return {
    lists: query.data ?? [],
    // only show the skeleton when there is nothing cached yet
    isLoading: query.isPending,
    error: query.isError
      ? "לא הצלחנו לטעון את הרשימות. כדאי לבדוק את החיבור ולנסות שוב."
      : null,
    refetch,
  };
};
