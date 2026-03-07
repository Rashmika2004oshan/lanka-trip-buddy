import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { LogIn, LogOut, User, ShieldCheck, Menu, X, Globe } from "lucide-react";
import { toast } from "sonner";
import { useI18n, LANGUAGE_OPTIONS } from "@/lib/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, language, setLanguage } = useI18n();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/vehicle-rental", label: t("nav.vehicles") },
    { href: "/accommodation", label: t("nav.hotels") },
    { href: "/special-places", label: t("nav.places") },
    { href: "/weather", label: t("nav.weather") },
    { href: "/map", label: t("nav.map") },
    { href: "/train-booking", label: t("nav.trains") },
  ];

  const handleAuthClick = async () => {
    if (user) {
      await signOut();
      toast.success("Signed out successfully");
    } else {
      navigate("/auth");
    }
    setMobileOpen(false);
  };

  const isActive = (href: string) => location.pathname === href;
  const currentLang = LANGUAGE_OPTIONS.find(l => l.value === language);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/40">
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-foreground cursor-pointer select-none" onClick={() => navigate("/")}>
          Sri Lanka<span className="text-primary ml-1">Travel</span>
        </h1>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map(link => (
            <a key={link.href} href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >{link.label}</a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{currentLang?.flag} {currentLang?.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGUAGE_OPTIONS.map(lang => (
                <DropdownMenuItem key={lang.value} onClick={() => setLanguage(lang.value)}
                  className={language === lang.value ? "bg-primary/10 text-primary" : ""}
                >
                  {lang.flag} {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="hidden md:flex gap-1.5 text-xs">
              <ShieldCheck className="h-4 w-4" /> {t("nav.admin")}
            </Button>
          )}

          {user && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="gap-1.5">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="hidden md:inline text-xs max-w-[120px] truncate">{user.email?.split("@")[0]}</span>
            </Button>
          )}

          <Button onClick={handleAuthClick} disabled={loading} variant={user ? "ghost" : "default"} size="sm" className="gap-1.5 text-xs">
            {user ? (
              <><LogOut className="h-3.5 w-3.5" /><span className="hidden md:inline">{t("nav.signOut")}</span></>
            ) : (
              <><LogIn className="h-3.5 w-3.5" />{t("nav.signIn")}</>
            )}
          </Button>

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border/40 bg-card/95 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 space-y-1">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >{link.label}</a>
            ))}
            {isAdmin && (
              <a href="/admin" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >Admin Dashboard</a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
