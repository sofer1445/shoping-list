import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const AuthContext = createContext<{ user: User | null } | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const previousUser = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    const update = (next: User | null) => {
      if (!active) return;
      if (previousUser.current !== (next?.id ?? null)) queryClient.clear();
      previousUser.current = next?.id ?? null;
      setUser(next);
      setIsLoading(false);
    };
    // Never call Supabase auth methods inside its auth callback: they share a lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      update(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!authEventReceived) update(error ? null : data.session?.user ?? null);
    }).catch(() => { if (!authEventReceived) update(null); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [queryClient]);

  useEffect(() => {
    if (!isLoading && user && location.pathname === "/auth") navigate("/", { replace: true });
  }, [isLoading, user, location.pathname, navigate]);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground" dir="rtl" role="status">טוען...</div>;
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};
