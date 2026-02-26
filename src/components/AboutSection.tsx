import { Card, CardContent } from "@/components/ui/card";
import { Scroll, Landmark, Palmtree } from "lucide-react";

const features = [
  {
    icon: Scroll,
    title: "Rich Heritage",
    description: "Over 2,500 years of recorded history with 8 UNESCO World Heritage Sites",
    gradient: "bg-gradient-tropical",
  },
  {
    icon: Landmark,
    title: "Ancient Kingdoms",
    description: "Explore magnificent ruins of ancient cities like Anuradhapura and Polonnaruwa",
    gradient: "bg-gradient-sunset",
  },
  {
    icon: Palmtree,
    title: "Natural Beauty",
    description: "From misty mountains to golden beaches, experience diverse tropical landscapes",
    gradient: "bg-primary",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-3">
          <p className="text-sm font-medium text-primary tracking-wide uppercase">About the island</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Welcome to Sri Lanka
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A tropical paradise where ancient civilizations, diverse wildlife, stunning landscapes, 
            and warm hospitality create unforgettable experiences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {features.map((f, i) => (
            <Card key={i} className="shadow-card hover:shadow-elevated transition-all duration-300 border-border/50 group">
              <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                <div className={`w-12 h-12 ${f.gradient} rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/50 rounded-2xl p-8 md:p-10 border border-border/40">
          <h3 className="text-2xl font-bold text-foreground mb-5">A Journey Through Time</h3>
          <div className="space-y-4 text-muted-foreground text-sm leading-relaxed columns-1 md:columns-2 gap-8">
            <p>
              Sri Lanka's history dates back over 2,500 years, beginning with the arrival of Prince Vijaya 
              from India in 543 BCE. The island flourished under successive Buddhist kingdoms, creating 
              architectural marvels like Sigiriya Rock Fortress and the Temple of the Tooth.
            </p>
            <p>
              Colonial powers—Portuguese (1505), Dutch (1658), and British (1815)—left their mark on 
              the island's culture, architecture, and cuisine. Sri Lanka gained independence in 1948 and 
              became a republic in 1972, embracing its rich multicultural heritage.
            </p>
            <p>
              Today, Sri Lanka stands as a testament to resilience and diversity, where ancient traditions 
              blend seamlessly with modern life, creating a unique destination beloved by travelers worldwide.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
