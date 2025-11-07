import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-srilanka.jpg";
import { ArrowDown } from "lucide-react";

const HeroSection = () => {
  const scrollToContent = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-background/80" />
      </div>
      
      <div className="relative h-full flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl">
            Discover the Pearl of the Indian Ocean
          </h1>
          <p className="text-xl md:text-2xl text-white/95 drop-shadow-lg max-w-2xl mx-auto">
            Experience the magic of Sri Lanka - where ancient history meets pristine beaches and vibrant culture
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="bg-secondary hover:bg-secondary/90 text-foreground font-semibold shadow-elevated"
              onClick={scrollToContent}
            >
              Start Exploring
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              onClick={() => document.getElementById('itinerary')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Plan Your Trip
            </Button>
          </div>
        </div>
      </div>

      <button 
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 hover:text-white transition-colors animate-bounce"
        aria-label="Scroll down"
      >
        <ArrowDown size={32} />
      </button>
    </section>
  );
};

export default HeroSection;
