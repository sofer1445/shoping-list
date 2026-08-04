
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthFormsProps {
  redirectTo?: string;
}

export const AuthForms = ({ redirectTo }: AuthFormsProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"sign_in" | "sign_up">("sign_in");
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("הסיסמה חייבת להכיל לפחות 8 תווים");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("הסיסמה חייבת להכיל לפחות אות לטינית קטנה אחת");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("הסיסמה חייבת להכיל לפחות אות לטינית גדולה אחת");
    }
    return errors;
  };

  const checkEmailExists = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });
      // If we get here without an error, the email exists
      return !error;
    } catch {
      // If there's an error, treat it as email not existing
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      toast({
        title: "סיסמה לא תקינה",
        description: passwordErrors.join('\n'),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "הסיסמאות אינן תואמות",
        description: "יש להזין את אותה הסיסמה בשני השדות",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check if email exists before attempting to sign up
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        toast({
          title: "כתובת האימייל כבר רשומה",
          description: "אפשר להתחבר עם הכתובת הזו או להשתמש בכתובת אחרת",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "ההרשמה הושלמה",
          description: "אפשר להתחבר עכשיו עם הפרטים שלך",
        });
        setView("sign_in");
      }
    } catch (error: any) {
      toast({
        title: "ההרשמה לא הושלמה",
        description: "בדוק את הפרטים ונסה שוב",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "ההתחברות לא הצליחה",
        description: "האימייל או הסיסמה אינם נכונים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "ההתחברות עם Google לא הצליחה",
        description: "נסה שוב בעוד רגע",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={view} onValueChange={(v) => setView(v as "sign_in" | "sign_up")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign_in">התחברות</TabsTrigger>
          <TabsTrigger value="sign_up">הרשמה</TabsTrigger>
        </TabsList>

        <TabsContent value="sign_in">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "מתחבר..." : "התחבר"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="sign_up">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="סיסמה"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  לפחות 8 תווים, כולל אות לטינית גדולה ואות לטינית קטנה
                </p>
              </div>
              <Input
                type="password"
                placeholder="אימות סיסמה"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "נרשם..." : "הירשם"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            או
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {view === "sign_in" ? "התחבר" : "הירשם"} עם Google
      </Button>
    </div>
  );
};
