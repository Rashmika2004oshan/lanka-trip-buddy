import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ItineraryPlanner = () => {
  const [days, setDays] = useState("");
  const [interests, setInterests] = useState({
    culture: false,
    beaches: false,
    nature: false,
    wildlife: false,
    adventure: false,
  });
  const [itinerary, setItinerary] = useState<string[]>([]);

  const generateItinerary = () => {
    const numDays = parseInt(days);
    
    if (!numDays || numDays < 1 || numDays > 30) {
      toast.error("Please enter a valid number of days (1-30)");
      return;
    }

    const selectedInterests = Object.entries(interests)
      .filter(([_, selected]) => selected)
      .map(([interest]) => interest);

    if (selectedInterests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }

    // Generate itinerary based on days and interests
    const suggestions: Record<string, string[]> = {
      culture: [
        "Visit Sigiriya Rock Fortress and ancient frescoes",
        "Explore Temple of the Tooth in Kandy",
        "Tour Anuradhapura ancient city ruins",
        "Discover Polonnaruwa archaeological site",
        "Experience traditional Kandyan dance performance",
      ],
      beaches: [
        "Relax at Mirissa Beach and watch whales",
        "Surf at Arugam Bay's pristine waves",
        "Explore Unawatuna's coral reefs",
        "Enjoy sunset at Negombo Beach",
        "Visit secluded Tangalle beaches",
      ],
      nature: [
        "Trek through Horton Plains and World's End",
        "Ride scenic train through tea country",
        "Visit Nuwara Eliya tea plantations",
        "Explore Sinharaja Rainforest",
        "Hike Adam's Peak at sunrise",
      ],
      wildlife: [
        "Safari in Yala National Park for leopards",
        "Elephant watching in Udawalawe",
        "Visit Pinnawala Elephant Orphanage",
        "Bird watching in Bundala National Park",
        "Whale watching in Mirissa",
      ],
      adventure: [
        "White water rafting in Kitulgala",
        "Rock climbing in Ella",
        "Zip-lining through tea estates",
        "Paragliding in Diyatalawa",
        "Scuba diving in Hikkaduwa",
      ],
    };

    const plan: string[] = [];
    let dayCount = 1;

    while (dayCount <= numDays) {
      for (const interest of selectedInterests) {
        if (dayCount > numDays) break;
        
        const activities = suggestions[interest];
        const activity = activities[(dayCount - 1) % activities.length];
        plan.push(`Day ${dayCount}: ${activity}`);
        dayCount++;
      }
    }

    setItinerary(plan);
    toast.success("Itinerary generated successfully!");
  };

  return (
    <section id="itinerary" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center items-center gap-2">
            <Sparkles className="w-8 h-8 text-secondary" />
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Plan Your Perfect Trip
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Tell us your preferences and we'll create a personalized itinerary for your Sri Lankan adventure
          </p>
        </div>

        <Card className="shadow-elevated border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Customize Your Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="days">Number of Days</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="30"
                placeholder="How many days will you stay?"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="border-border"
              />
            </div>

            <div className="space-y-3">
              <Label>What interests you?</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(interests).map((interest) => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={interests[interest as keyof typeof interests]}
                      onCheckedChange={(checked) =>
                        setInterests({ ...interests, [interest]: checked as boolean })
                      }
                    />
                    <label
                      htmlFor={interest}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {interest}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={generateItinerary} 
              className="w-full bg-gradient-tropical hover:opacity-90 text-white"
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate My Itinerary
            </Button>

            {itinerary.length > 0 && (
              <div className="mt-8 space-y-3 p-6 bg-gradient-hero rounded-xl border border-border/30">
                <h3 className="text-xl font-semibold text-foreground mb-4">Your Personalized Itinerary</h3>
                {itinerary.map((day, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-foreground pt-1">{day}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ItineraryPlanner;
