import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, Car, Hotel, Plane } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type UserType = "traveller" | "driver" | "hotel_owner";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserType>("traveller");
  const [formData, setFormData] = useState({ email: "", password: "", fullName: "" });
  const [resetEmail, setResetEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
        if (error) throw error;
        toast.success(t("auth.welcomeBack") + "!");
        navigate("/");
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: formData.email, password: formData.password,
          options: { data: { full_name: formData.fullName, selected_role: selectedRole }, emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        if (signUpData.user && selectedRole !== "traveller") {
          await supabase.from("user_roles").insert({ user_id: signUpData.user.id, role: selectedRole as any });
          await supabase.from("role_requests").upsert({ user_id: signUpData.user.id, requested_role: selectedRole as any, status: "approved" }, { onConflict: "user_id,requested_role" });
        }
        toast.success(t("auth.createAccount") + "! ✓");
        if (selectedRole === "driver") navigate("/driver-survey");
        else if (selectedRole === "hotel_owner") navigate("/hotel-survey");
        else navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setResetEmail("");
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: "traveller" as UserType, label: t("profile.traveller"), icon: Plane, desc: t("auth.planTripsBook") },
    { value: "driver" as UserType, label: t("profile.vehicleOwner"), icon: Car, desc: t("auth.listVehicles") },
    { value: "hotel_owner" as UserType, label: t("profile.hotelOwner"), icon: Hotel, desc: t("auth.listHotels") },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-display text-center">
            {isForgotPassword 
              ? "Reset Password" 
              : isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}
          </CardTitle>
          <CardDescription className="text-center">
            {isForgotPassword 
              ? "Enter your email to receive a password reset link"
              : isLogin ? t("auth.signInDesc") : t("auth.signUpDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isForgotPassword ? handlePasswordReset : handleSubmit} className="space-y-4">
            {isForgotPassword ? (
              // Forgot Password Form
              <>
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="resetEmail" 
                      type="email" 
                      placeholder="you@example.com" 
                      className="pl-10" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <div className="text-center text-sm">
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPassword(false)} 
                    className="text-primary hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            ) : (
              // Login/Signup Form
              <>
              {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>{t("auth.iAmA")}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map((role) => {
                      const Icon = role.icon;
                      return (
                        <button key={role.value} type="button" onClick={() => setSelectedRole(role.value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${
                            selectedRole === role.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                          }`}>
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-medium">{role.label}</span>
                          <span className="text-[10px] leading-tight opacity-70">{role.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" type="text" placeholder="John Doe" className="pl-10" value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required={!isLogin} />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10"
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {isLogin && (
              <div className="text-right">
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)} 
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.loading") : isLogin ? t("auth.signIn") : t("auth.signUp")}
            </Button>
            {!isLogin && selectedRole !== "traveller" && (
              <p className="text-xs text-muted-foreground text-center">{t("auth.afterSignup")}</p>
            )}
            <div className="text-center text-sm">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
                {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}
              </button>
            </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
