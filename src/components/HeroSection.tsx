import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-srilanka.jpg";
import { ArrowDown, MapPin } from "lucide-react";

const HeroSection = () => {
  const scrollToContent = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-[92vh] w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/10 to-background" />
      </div>
      
      <div className="relative h-full flex items-end pb-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide uppercase">South Asia</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-[0.95]">
              Discover<br />Sri Lanka
            </h1>
            <p className="text-lg text-white/85 max-w-lg leading-relaxed">
              Ancient temples, pristine coastlines, and misty highlands — 
              craft your perfect journey through the pearl of the Indian Ocean.
            </p>
            <div className="flex gap-3 pt-2">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8"
                onClick={() => document.getElementById('itinerary')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Plan Your Trip
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/25 text-white hover:bg-white/20"
                onClick={scrollToContent}
              >
                Explore
              </Button>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={scrollToContent}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors"
        aria-label="Scroll down"
      >
        <ArrowDown size={24} className="animate-bounce" />
      </button>
    </section>
  );
};

export default HeroSection;
