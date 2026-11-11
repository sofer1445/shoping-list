import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ShoppingBasket } from "lucide-react";
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
    <div className="min-h-[100dvh] flex items-center justify-center bg-background py-10 px-6" dir="rtl">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShoppingBasket className="h-8 w-8" /></div>
          <h1 className="text-center text-4xl font-display font-bold text-foreground">
            סל קניות
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            הקניות של הבית, במקום אחד
          </p>
        </div>
        <CustomAuth redirectTo={redirectTo} />
      </div>
    </div>
  );
};

export default AuthPage;