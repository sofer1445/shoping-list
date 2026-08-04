import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { CustomAuth } from "@/components/auth/CustomAuth";

const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Use the exact URL format as defined in Supabase
  const redirectTo = window.location.origin;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-2xl border border-border/60 shadow-sm">
        <div>
          <h1 className="mt-6 text-center text-3xl font-display font-bold text-foreground">
            סל קניות
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            התחברו או הירשמו כדי לנהל רשימות קניות משותפות
          </p>
        </div>
        <CustomAuth redirectTo={redirectTo} />
      </div>
    </div>
  );
};

export default AuthPage;