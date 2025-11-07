import { Card, CardContent } from "@/components/ui/card";
import sigiriya from "@/assets/sigiriya.jpg";
import teaPlantation from "@/assets/tea-plantation.jpg";
import kandyTemple from "@/assets/kandy-temple.jpg";
import yalaPark from "@/assets/yala-park.jpg";
import galleFort from "@/assets/galle-fort.jpg";

const places = [
  {
    name: "Sigiriya Rock Fortress",
    description: "Ancient rock fortress and palace ruins with stunning frescoes and gardens. A UNESCO World Heritage Site rising 200m above the jungle.",
    image: sigiriya,
  },
  {
    name: "Tea Plantations",
    description: "Rolling hills covered in emerald tea estates. Visit colonial tea factories and taste world-renowned Ceylon tea in the cool highlands.",
    image: teaPlantation,
  },
  {
    name: "Temple of the Tooth",
    description: "Sacred Buddhist temple in Kandy housing a tooth relic of Buddha. Experience daily ceremonies and rich spiritual traditions.",
    image: kandyTemple,
  },
  {
    name: "Yala National Park",
    description: "Premier wildlife destination with highest leopard density in the world. See elephants, sloth bears, and exotic birds on safari.",
    image: yalaPark,
  },
  {
    name: "Galle Fort",
    description: "Historic Dutch colonial fort with cobblestone streets, lighthouse, and ocean views. A living heritage site with cafes and boutiques.",
    image: galleFort,
  },
];

const PlacesSection = () => {
  return (
    <section id="places" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Must-Visit Destinations
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Discover the iconic landmarks and hidden gems that make Sri Lanka extraordinary
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((place, index) => (
            <Card 
              key={index} 
              className="overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 border-border/50 group"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={place.image} 
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white">
                  {place.name}
                </h3>
              </div>
              <CardContent className="pt-4">
                <p className="text-muted-foreground">
                  {place.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlacesSection;
