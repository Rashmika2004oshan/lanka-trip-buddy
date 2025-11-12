import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Sparkles, Save, LogIn, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Hotel {
  id: string;
  hotel_name: string;
  stars: number;
  per_night_charge: number;
  category: string;
  city: string;
}

interface Vehicle {
  id: string;
  vehicle_type: string;
  model: string;
  per_km_charge: number;
}

const ItineraryPlanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState("");
  const [itineraryTitle, setItineraryTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState({
    culture: false,
    beaches: false,
    nature: false,
    wildlife: false,
    adventure: false,
  });
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  useEffect(() => {
    fetchHotelsAndVehicles();
  }, []);

  const fetchHotelsAndVehicles = async () => {
    try {
      const [hotelsData, vehiclesData] = await Promise.all([
        supabase.from('hotels').select('*'),
        supabase.from('vehicles').select('*')
      ]);
      
      if (hotelsData.data) setHotels(hotelsData.data);
      if (vehiclesData.data) setVehicles(vehiclesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const generateItinerary = () => {
    const numDays = parseInt(days);
    const budgetAmount = parseFloat(budget);
    
    if (!numDays || numDays < 1 || numDays > 30) {
      toast.error("Please enter a valid number of days (1-30)");
      return;
    }

    if (!budgetAmount || budgetAmount < 1) {
      toast.error("Please enter a valid budget");
      return;
    }

    const selectedInterests = Object.entries(interests)
      .filter(([_, selected]) => selected)
      .map(([interest]) => interest);

    if (selectedInterests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }

    // City mapping based on interests
    const cityMapping: Record<string, string[]> = {
      culture: ["Kandy", "Sigiriya", "Colombo"],
      beaches: ["Mirissa", "Galle", "Colombo"],
      nature: ["Kandy", "Sigiriya"],
      wildlife: ["Sigiriya"],
      adventure: ["Kandy", "Galle"],
    };

    // Get relevant cities
    const relevantCities = [...new Set(
      selectedInterests.flatMap(interest => cityMapping[interest] || [])
    )];

    // Filter hotels by budget and cities
    const affordableHotels = hotels.filter(h => 
      h.per_night_charge <= (budgetAmount / numDays) * 0.7 &&
      relevantCities.includes(h.city)
    ).sort((a, b) => b.stars - a.stars);

    // Select best vehicle within budget
    const dailyBudgetForTransport = (budgetAmount / numDays) * 0.3;
    const avgKmPerDay = 100; // Average travel distance
    const affordableVehicles = vehicles.filter(v => 
      v.per_km_charge * avgKmPerDay <= dailyBudgetForTransport
    ).sort((a, b) => a.per_km_charge - b.per_km_charge);

    if (affordableHotels.length === 0) {
      toast.error("No hotels found within your budget. Try increasing your budget.");
      return;
    }

    if (affordableVehicles.length === 0) {
      toast.error("No vehicles found within your budget. Try increasing your budget.");
      return;
    }

    // Activity suggestions
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

    const plan: any[] = [];
    let total = 0;
    const selectedVehicle = affordableVehicles[0];

    for (let i = 0; i < numDays; i++) {
      const interest = selectedInterests[i % selectedInterests.length];
      const activities = suggestions[interest];
      const activity = activities[i % activities.length];
      
      // Select hotel for this day
      const hotel = affordableHotels[i % affordableHotels.length];
      const dailyTransportCost = selectedVehicle.per_km_charge * avgKmPerDay;
      
      plan.push({
        day: i + 1,
        activity,
        hotel: hotel.hotel_name,
        hotelCity: hotel.city,
        hotelCost: hotel.per_night_charge,
        transport: selectedVehicle.model,
        transportCost: dailyTransportCost,
        dailyTotal: hotel.per_night_charge + dailyTransportCost
      });
      
      total += hotel.per_night_charge + dailyTransportCost;
    }

    setItinerary(plan);
    setTotalCost(total);
    toast.success("Itinerary generated successfully!");
  };

  const saveItinerary = async () => {
    if (!user) {
      toast.error("Please sign in to save itineraries");
      navigate("/auth");
      return;
    }

    if (!itineraryTitle.trim()) {
      toast.error("Please enter a title for your itinerary");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("saved_itineraries").insert({
        user_id: user.id,
        title: itineraryTitle,
        days: parseInt(days),
        interests,
        itinerary_data: itinerary,
      });

      if (error) throw error;
      toast.success("Itinerary saved successfully!");
      setItineraryTitle("");
    } catch (error: any) {
      toast.error(error.message || "Failed to save itinerary");
    } finally {
      setSaving(false);
    }
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
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days">Number of Days</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="How many days?"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget (USD)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="1"
                  placeholder="Your budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="border-border"
                />
              </div>
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
              <div className="mt-8 space-y-4">
                <div className="p-6 bg-gradient-hero rounded-xl border border-border/30">
                  <h3 className="text-xl font-semibold text-foreground mb-4">Your Personalized Itinerary</h3>
                  <div className="space-y-4">
                    {itinerary.map((dayPlan, index) => (
                      <Card key={index} className="p-4 bg-background/50">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                            {dayPlan.day}
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="font-semibold text-foreground">{dayPlan.activity}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">🏨 Hotel:</span> {dayPlan.hotel} ({dayPlan.hotelCity})
                              </div>
                              <div>
                                <span className="font-medium">🚗 Transport:</span> {dayPlan.transport}
                              </div>
                              <div>
                                <span className="font-medium">💵 Accommodation:</span> ${dayPlan.hotelCost.toFixed(2)}
                              </div>
                              <div>
                                <span className="font-medium">💵 Transport:</span> ${dayPlan.transportCost.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-primary">
                              Day Total: ${dayPlan.dailyTotal.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Total Estimated Cost:
                      </span>
                      <span className="text-2xl font-bold text-primary">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {user ? (
                  <Button
                    onClick={() => setSaveDialogOpen(true)}
                    className="w-full bg-gradient-tropical text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Itinerary
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/auth")}
                    variant="outline"
                    className="w-full"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in to save your itinerary
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Your Itinerary</DialogTitle>
              <DialogDescription>
                Give your itinerary a memorable name to find it easily later
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Itinerary Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Amazing Sri Lanka Adventure"
                  value={itineraryTitle}
                  onChange={(e) => setItineraryTitle(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveItinerary} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default ItineraryPlanner;
