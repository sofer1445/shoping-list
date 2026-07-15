import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export interface PresenceUser {
  user_id: string;
  username: string;
}

/**
 * Tracks who is currently active on a given list via Supabase presence.
 * Also returns a rolling "just updated" flag that pulses on any realtime
 * postgres change to shopping_items for the list.
 */
export const useListPresence = (listId: string | null) => {
  const { user } = useAuth();
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const [justUpdated, setJustUpdated] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!listId || !user) return;

    const username = (user.email || "").split("@")[0] || "משתמש";
    const channel = supabase.channel(`presence-${listId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, any[]>;
        const users: PresenceUser[] = [];
        Object.entries(state).forEach(([uid, metas]) => {
          const meta = metas?.[0];
          users.push({ user_id: uid, username: meta?.username || "משתמש" });
        });
        setOnline(users);
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items", filter: `list_id=eq.${listId}` },
        () => {
          setJustUpdated(true);
          setTimeout(() => setJustUpdated(false), 2200);
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ username, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, user?.id]);

  // Fetch profile display names for members that appear in items
  useEffect(() => {
    if (!listId) return;
    let cancelled = false;
    (async () => {
      const { data: items } = await supabase
        .from("shopping_items")
        .select("created_by, completed_by")
        .eq("list_id", listId);
      const ids = new Set<string>();
      (items || []).forEach((i: any) => {
        if (i.created_by) ids.add(i.created_by);
        if (i.completed_by) ids.add(i.completed_by);
      });
      if (ids.size === 0) return;
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", Array.from(ids));
      if (cancelled) return;
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => {
        map[p.id] = (p.username || "").split("@")[0] || "משתמש";
      });
      setProfiles(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [listId]);

  return { online, justUpdated, profiles };
};
