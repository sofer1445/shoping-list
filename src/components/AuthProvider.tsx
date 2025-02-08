import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

type AuthContextType = {
  user: User | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize the session
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          // Clear any stale session data
          setUser(null);
          localStorage.removeItem('supabase.auth.token');
          
          if (location.pathname !== '/auth') {
            navigate('/auth');
          }
          return;
        }
        
        setUser(session?.user ?? null);
        
        if (!session && location.pathname !== '/auth') {
          navigate('/auth');
        }
      } catch (error: any) {
        console.error("Error getting session:", error);
        // Clear any stale session data
        setUser(null);
        localStorage.removeItem('supabase.auth.token');
        
        toast({
          title: "שגיאת התחברות",
          description: "אירעה שגיאה במהלך ההתחברות. אנא התחבר מחדש.",
          variant: "destructive",
        });
        
        if (location.pathname !== '/auth') {
          navigate('/auth');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      
      if (event === 'SIGNED_OUT') {
        // Clear any stale session data
        setUser(null);
        localStorage.removeItem('supabase.auth.token');
        
        if (location.pathname !== '/auth') {
          navigate('/auth');
        }
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
        if (location.pathname === '/auth') {
          navigate('/');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};
