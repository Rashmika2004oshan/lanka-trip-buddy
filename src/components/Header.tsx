import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, User } from "lucide-react";
import { toast } from "sonner";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  const handleAuthClick = async () => {
    if (user) {
      await signOut();
      toast.success("Signed out successfully");
    } else {
      navigate("/auth");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-display font-bold bg-gradient-tropical bg-clip-text text-transparent">
              Sri Lanka Travel
            </h1>
            <div className="hidden md:flex gap-6">
              <a href="#hero" className="text-foreground/80 hover:text-foreground transition-colors">
                Home
              </a>
              <a href="#about" className="text-foreground/80 hover:text-foreground transition-colors">
                About
              </a>
              <a href="#places" className="text-foreground/80 hover:text-foreground transition-colors">
                Places
              </a>
              <a href="#map" className="text-foreground/80 hover:text-foreground transition-colors">
                Map
              </a>
              <a href="#itinerary" className="text-foreground/80 hover:text-foreground transition-colors">
                Itinerary
              </a>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{user.email}</span>
              </div>
            )}
            <Button
              onClick={handleAuthClick}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              {user ? (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
