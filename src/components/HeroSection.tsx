import { Button } from "@/components/ui/button";
import heroImage from "@/assets/sri lanka image.png";
import { ArrowDown, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const HeroSection = () => {
  const { t } = useI18n();

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
            <div className="flex items-center gap-2 text-white/80 animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
              <MapPin className="w-4 h-4 animate-in fade-in slide-in-from-top-2 duration-300 delay-300" />
              <span className="text-sm font-medium tracking-wide uppercase">{t("hero.region")}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
              {t("hero.title").split(" ").length > 1 ? (
                <>{t("hero.title").split(" ").slice(0, -2).join(" ")}<br />{t("hero.title").split(" ").slice(-2).join(" ")}</>
              ) : t("hero.title")}
            </h1>
            <p className="text-lg text-white/85 max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-800 delay-700">
              {t("hero.subtitle")}
            </p>
            <div className="flex gap-3 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-600 delay-900">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => document.getElementById('itinerary')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t("hero.planTrip")}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/25 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={scrollToContent}
              >
                {t("hero.explore")}
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
