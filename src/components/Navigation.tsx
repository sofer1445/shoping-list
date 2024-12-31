import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "שגיאה בהתנתקות",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "התנתקת בהצלחה",
        description: "להתראות!",
      });
      navigate("/auth");
    }
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <span className="text-gray-700">{user.email}</span>
          </div>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="inline-flex items-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
            התנתק
          </Button>
        </div>
      </div>
    </nav>
  );
};