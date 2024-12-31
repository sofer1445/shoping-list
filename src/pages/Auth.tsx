import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

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

  // Get the current URL without any trailing slashes or colons
  const redirectTo = `${window.location.origin}/auth/callback`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            רשימת קניות אפליצקי
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            התחבר או הירשם כדי להשתמש ברשימת הקניות המשותפת
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                },
              },
            },
          }}
          providers={["google"]}
          redirectTo={redirectTo}
          view="sign_in"
          localization={{
            variables: {
              sign_in: {
                email_label: 'אימייל',
                password_label: 'סיסמה',
                button_label: 'התחבר',
                social_provider_text: "התחבר באמצעות Google",
                link_text: "אין לך חשבון? הירשם",
              },
              sign_up: {
                email_label: 'אימייל',
                password_label: 'סיסמה',
                button_label: 'הירשם',
                social_provider_text: "הירשם באמצעות Google",
                link_text: "כבר יש לך חשבון? התחבר",
              },
            },
          }}
          onlyThirdPartyProviders={true}
        />
      </div>
    </div>
  );
};

export default AuthPage;