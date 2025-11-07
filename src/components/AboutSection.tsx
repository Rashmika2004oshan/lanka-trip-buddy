import { Card, CardContent } from "@/components/ui/card";
import { Scroll, Landmark, Palmtree } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Welcome to Sri Lanka
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            A tropical paradise where ancient civilizations, diverse wildlife, stunning landscapes, 
            and warm hospitality create unforgettable experiences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-border/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-tropical rounded-full flex items-center justify-center mx-auto">
                <Scroll className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Rich Heritage</h3>
              <p className="text-muted-foreground">
                Over 2,500 years of recorded history with 8 UNESCO World Heritage Sites
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-border/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-sunset rounded-full flex items-center justify-center mx-auto">
                <Landmark className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Ancient Kingdoms</h3>
              <p className="text-muted-foreground">
                Explore magnificent ruins of ancient cities like Anuradhapura and Polonnaruwa
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elevated transition-all duration-300 border-border/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
                <Palmtree className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Natural Beauty</h3>
              <p className="text-muted-foreground">
                From misty mountains to golden beaches, experience diverse tropical landscapes
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-hero rounded-2xl p-8 md:p-12 border border-border/30">
          <h3 className="text-3xl font-bold text-foreground mb-6">A Journey Through Time</h3>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
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
