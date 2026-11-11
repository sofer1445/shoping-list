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
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="mx-auto max-w-2xl px-5 h-[64px] flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0 border border-primary/10">
            <ShoppingBasket className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight text-right">
            <div className="font-display font-bold text-[18px]">סל קניות</div>
            <div className="text-xs text-muted-foreground truncate max-w-[140px] font-medium">{user.email}</div>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-full text-muted-foreground hover:text-destructive transition-colors"
          aria-label="התנתק"
        >
          <LogOut className="h-5 w-5 rotate-180" />
        </Button>
      </div>
    </header>
  );
};
