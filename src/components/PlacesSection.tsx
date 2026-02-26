import { Card } from "@/components/ui/card";
import sigiriya from "@/assets/sigiriya.jpg";
import teaPlantation from "@/assets/tea-plantation.jpg";
import kandyTemple from "@/assets/kandy-temple.jpg";
import yalaPark from "@/assets/yala-park.jpg";
import galleFort from "@/assets/galle-fort.jpg";

const places = [
  { name: "Sigiriya Rock Fortress", description: "Ancient rock fortress and palace ruins with stunning frescoes. A UNESCO World Heritage Site.", image: sigiriya },
  { name: "Tea Plantations", description: "Rolling hills covered in emerald tea estates. Taste world-renowned Ceylon tea in the highlands.", image: teaPlantation },
  { name: "Temple of the Tooth", description: "Sacred Buddhist temple in Kandy housing a tooth relic of Buddha.", image: kandyTemple },
  { name: "Yala National Park", description: "Premier wildlife destination with highest leopard density in the world.", image: yalaPark },
  { name: "Galle Fort", description: "Historic Dutch colonial fort with cobblestone streets, lighthouse, and ocean views.", image: galleFort },
];

const PlacesSection = () => {
  return (
    <section id="places" className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14 space-y-3">
          <p className="text-sm font-medium text-primary tracking-wide uppercase">Destinations</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Must-Visit Places
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the iconic landmarks that make Sri Lanka extraordinary
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {places.map((place, index) => (
            <Card 
              key={index} 
              className="overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 border-border/40 group cursor-default"
            >
              <div className="relative h-52 overflow-hidden">
                <img 
                  src={place.image} 
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-lg font-bold text-white mb-1">{place.name}</h3>
                  <p className="text-white/80 text-xs leading-relaxed line-clamp-2">{place.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlacesSection;
