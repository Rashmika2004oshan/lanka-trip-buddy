import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Mountain, Waves, TreePalm, Landmark, Gem } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const specialPlaces = [
  {
    name: "Sigiriya Rock Fortress",
    city: "Dambulla",
    category: "UNESCO Heritage",
    icon: Landmark,
    description:
      "An ancient rock fortress rising 200 meters above the surrounding plains. Built by King Kashyapa in the 5th century, it features spectacular frescoes, mirror walls, and the iconic Lion's Paw entrance. The summit offers breathtaking 360-degree views of the lush Sri Lankan countryside.",
    highlights: ["Lion's Paw Gate", "Ancient Frescoes", "Water Gardens", "Summit Palace Ruins"],
  },
  {
    name: "Temple of the Sacred Tooth Relic",
    city: "Kandy",
    category: "Cultural",
    icon: Landmark,
    description:
      "Sri Lanka's most sacred Buddhist temple, housing a tooth relic of Lord Buddha. Located within the royal palace complex by Kandy Lake, the temple hosts daily puja ceremonies and the grand annual Esala Perahera festival with decorated elephants.",
    highlights: ["Daily Puja Ceremonies", "Esala Perahera Festival", "Royal Palace Complex", "Kandy Lake"],
  },
  {
    name: "Galle Fort",
    city: "Galle",
    category: "UNESCO Heritage",
    icon: Landmark,
    description:
      "A stunning 16th-century Dutch colonial fort perched on a rocky headland. Wander cobblestone streets lined with boutique shops, art galleries, and cafés. The iconic lighthouse and rampart walks offer spectacular ocean sunsets.",
    highlights: ["Dutch Colonial Architecture", "Lighthouse", "Rampart Walks", "Boutique Shopping"],
  },
  {
    name: "Ella & Nine Arches Bridge",
    city: "Ella",
    category: "Scenic",
    icon: Mountain,
    description:
      "A charming hill-country town surrounded by tea plantations and misty mountains. The iconic Nine Arches Bridge is an engineering marvel built entirely of stone and brick. Hike Little Adam's Peak for panoramic valley views.",
    highlights: ["Nine Arches Bridge", "Little Adam's Peak", "Tea Plantations", "Ravana Falls"],
  },
  {
    name: "Yala National Park",
    city: "Tissamaharama",
    category: "Wildlife",
    icon: TreePalm,
    description:
      "Sri Lanka's premier wildlife sanctuary and home to the world's highest density of leopards. The park also shelters elephants, sloth bears, crocodiles, and over 200 bird species across diverse ecosystems of jungle, lagoons, and coastline.",
    highlights: ["Leopard Safaris", "Elephant Herds", "Bird Watching", "Coastal Lagoons"],
  },
  {
    name: "Adam's Peak (Sri Pada)",
    city: "Ratnapura",
    category: "Pilgrimage",
    icon: Mountain,
    description:
      "A sacred 2,243m mountain revered by Buddhists, Hindus, Muslims, and Christians alike. The sunrise pilgrimage involves climbing 5,500 steps through cloud forests. At the summit sits the Sacred Footprint, attracting thousands of devotees annually.",
    highlights: ["Sunrise Trek", "Sacred Footprint", "5,500 Steps", "Cloud Forest"],
  },
  {
    name: "Mirissa Beach",
    city: "Mirissa",
    category: "Beach",
    icon: Waves,
    description:
      "A crescent-shaped tropical beach famous for whale watching between November and April. Spot blue whales and dolphins on morning boat tours, then relax on golden sands, surf gentle waves, or enjoy fresh seafood at beachfront restaurants.",
    highlights: ["Whale Watching", "Surfing", "Coconut Tree Hill", "Fresh Seafood"],
  },
  {
    name: "Nuwara Eliya",
    city: "Nuwara Eliya",
    category: "Hill Country",
    icon: Mountain,
    description:
      "Known as 'Little England' for its colonial-era bungalows and cool climate at 1,868m elevation. Visit sprawling tea estates, the stunning Gregory Lake, Hakgala Botanical Gardens, and enjoy strawberry farms amidst misty green hills.",
    highlights: ["Tea Estate Tours", "Gregory Lake", "Hakgala Gardens", "Strawberry Farms"],
  },
  {
    name: "Anuradhapura Ancient City",
    city: "Anuradhapura",
    category: "UNESCO Heritage",
    icon: Landmark,
    description:
      "One of the oldest continuously inhabited cities in the world, serving as Sri Lanka's capital for over 1,300 years. Explore massive dagobas, ancient monasteries, sacred Bo trees, and intricate stone carvings spanning millennia of Buddhist civilization.",
    highlights: ["Ruwanwelisaya Stupa", "Sri Maha Bodhi Tree", "Jetavanaramaya", "Isurumuniya"],
  },
  {
    name: "Trincomalee & Nilaveli Beach",
    city: "Trincomalee",
    category: "Beach & Heritage",
    icon: Waves,
    description:
      "Home to one of the world's finest natural harbors and pristine beaches. Visit the ancient Koneswaram Temple perched on Swami Rock, snorkel at Pigeon Island, and relax on the powder-white sands of Nilaveli. Hot springs at Kanniya add a unique touch.",
    highlights: ["Koneswaram Temple", "Pigeon Island Snorkeling", "Nilaveli Beach", "Kanniya Hot Springs"],
  },
];

const getCategoryColor = (category: string) => {
  if (category.includes("UNESCO")) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  if (category.includes("Beach")) return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
  if (category.includes("Wildlife")) return "bg-green-500/10 text-green-600 border-green-500/20";
  if (category.includes("Scenic") || category.includes("Hill")) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (category.includes("Pilgrimage")) return "bg-purple-500/10 text-purple-600 border-purple-500/20";
  return "bg-primary/10 text-primary border-primary/20";
};

const SpecialPlaces = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14 space-y-3">
            <p className="text-sm font-medium text-primary tracking-wide uppercase">Destinations</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {t("places.title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("places.subtitle")}
            </p>
          </div>

          <div className="grid gap-6">
            {specialPlaces.map((place, index) => {
              const Icon = place.icon;
              return (
                <Card key={index} className="overflow-hidden border-border/50 hover:shadow-elevated transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Icon/Number Section */}
                      <div className="md:w-48 bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center p-8 md:p-6 shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-primary/60 uppercase tracking-widest">#{index + 1}</span>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-6 md:p-8">
                        <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                          <div>
                            <h2 className="text-xl font-bold text-foreground mb-1">{place.name}</h2>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {place.city}
                            </div>
                          </div>
                          <Badge variant="outline" className={getCategoryColor(place.category)}>
                            {place.category}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {place.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {place.highlights.map((h, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-normal">
                              <Gem className="h-3 w-3 mr-1" />
                              {h}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SpecialPlaces;
