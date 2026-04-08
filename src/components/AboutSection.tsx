import { Card, CardContent } from "@/components/ui/card";
import ancientKingdoms from "@/assets/welcome assets/ancient kingdoms.jpg";
import naturalBeauty from "@/assets/welcome assets/natural beauty.jpg";
import richHeritage from "@/assets/welcome assets/rich heritage.jpg";
import { useI18n } from "@/lib/i18n";

const AboutSection = () => {
  const { t } = useI18n();

  const welcomeImages = [
    { src: ancientKingdoms, alt: "Ancient Kingdoms" },
    { src: naturalBeauty, alt: "Natural Beauty" },
    { src: richHeritage, alt: "Rich Heritage" },
  ];

  return (
    <section id="about" className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground animate-in fade-in slide-in-from-bottom-6 duration-800 delay-300">
            Welcome to Sri Lanka
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-600 delay-500">
            A tropical paradise where ancient civilizations, diverse wildlife, stunning landscapes, and warm hospitality create unforgettable experiences
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden min-h-[400px] animate-in fade-in slide-in-from-bottom-6 duration-800 delay-1000 hover:shadow-lg transition-shadow duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {welcomeImages.map((image, index) => (
              <div key={index} className="relative group overflow-hidden rounded-lg">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent" />
                
                {/* Bottom text with glow effect */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold text-lg transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] group-hover:scale-105 group-hover:brightness-110 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-${(index + 1) * 200}">{image.alt}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
