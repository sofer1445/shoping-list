import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { LogOut, ShoppingBasket } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";

export const Navigation = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast({ title: "התנתקת בהצלחה" });
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast({ title: "שגיאה בהתנתקות", description: error.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/60">
      <div className="mx-auto max-w-md px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingBasket className="h-4 w-4 text-primary" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <div className="font-display font-semibold text-[15px]">סל</div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{user.email}</div>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="התנתק"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};
