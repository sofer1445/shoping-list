import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";

export const Navigation = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      // נקה קודם את ה-local storage
      localStorage.removeItem('supabase.auth.token');
      
      // נסה להתנתק
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        toast({
          title: "שגיאה בהתנתקות",
          description: "נסה לרענן את הדף ולהתנתק שוב",
          variant: "destructive",
        });
      } else {
        // נקה את המצב המקומי
        setUser(null);
        
        toast({
          title: "התנתקת בהצלחה",
          description: "להתראות!",
        });
        
        // נווט לדף ההתחברות
        navigate("/auth", { replace: true });
      }
    } catch (error: unknown) {
      console.error("Unexpected logout error:", error);
      toast({
        title: "שגיאה בהתנתקות",
        description: error instanceof Error ? error.message : "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <nav 
      className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="inline-flex items-center"
              aria-label="התנתק מהמערכת"
            >
              <LogOut className="h-4 w-4 mr-2" />
              התנתק
            </Button>
          </div>
          <div className="flex items-center">
            <span 
              className="text-gray-700 dark:text-gray-300 text-sm"
              aria-label={`משתמש מחובר: ${user.email}`}
            >
              {user.email}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};
