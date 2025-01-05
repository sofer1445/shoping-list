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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Applitsky Shopping List
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Log in or sign up to use the shared shopping list
          </p>
        </div>
        <CustomAuth redirectTo={redirectTo} />
      </div>
    </div>
  );
};

export default AuthPage;