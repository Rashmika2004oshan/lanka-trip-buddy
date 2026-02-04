import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Sparkles, Save, LogIn, DollarSign, Loader2, Download, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
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
  vehicle_category: string | null;
}

interface Destination {
  id: string;
  interest_category: string;
  name: string;
  description: string;
  city: string | null;
}

interface VehicleType {
  id: string;
  name: string;
  min_passengers: number;
  max_passengers: number;
  description: string | null;
}

interface VehicleClass {
  id: string;
  vehicle_type_id: string;
  class_name: string;
  price_multiplier: number;
  description: string | null;
}

const ItineraryPlanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState("");
  const [guests, setGuests] = useState("1");
  const [itineraryTitle, setItineraryTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState({
    culture: false,
    beaches: false,
    nature: false,
    wildlife: false,
  });
  const [hotelCategory, setHotelCategory] = useState<string>("");
  const [vehicleType, setVehicleType] = useState<string>("");
  const [vehicleCategory, setVehicleCategory] = useState<string>("");
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [hotelsData, vehiclesData, destinationsData, vehicleTypesData, vehicleClassesData] = await Promise.all([
        supabase.from('hotels').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('destinations').select('*'),
        supabase.from('vehicle_types').select('*'),
        supabase.from('vehicle_classes').select('*')
      ]);
      
      if (hotelsData.data) setHotels(hotelsData.data);
      if (vehiclesData.data) setVehicles(vehiclesData.data);
      if (destinationsData.data) setDestinations(destinationsData.data);
      if (vehicleTypesData.data) setVehicleTypes(vehicleTypesData.data);
      if (vehicleClassesData.data) setVehicleClasses(vehicleClassesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Get destinations for selected interests
  const getDestinationsForInterests = () => {
    const selectedInterests = Object.entries(interests)
      .filter(([_, selected]) => selected)
      .map(([interest]) => interest.charAt(0).toUpperCase() + interest.slice(1));
    
    return destinations.filter(d => selectedInterests.includes(d.interest_category));
  };

  // Get available vehicle types based on guest count using database data
  const getAvailableVehicleTypes = () => {
    const guestCount = parseInt(guests) || 1;
    
    return vehicleTypes
      .filter(vt => guestCount >= vt.min_passengers && guestCount <= vt.max_passengers || 
                   (vt.name === 'Bus' && guestCount > 7) ||
                   (vt.name === 'Van' && guestCount >= 5 && guestCount <= 7) ||
                   (vt.name === 'Car' && guestCount <= 4))
      .map(vt => ({
        value: vt.name,
        label: `${vt.name} (${vt.min_passengers}-${vt.max_passengers === 30 ? '+' : vt.max_passengers} passengers)`
      }));
  };

  // Get available vehicle classes for selected type
  const getAvailableVehicleClasses = () => {
    const selectedType = vehicleTypes.find(vt => vt.name === vehicleType);
    if (!selectedType) return [];
    return vehicleClasses.filter(vc => vc.vehicle_type_id === selectedType.id);
  };

  // Get filtered hotels based on category
  const getFilteredHotels = () => {
    if (!hotelCategory) return [];
    return hotels.filter(h => h.category === hotelCategory);
  };

  // Get filtered vehicles based on type and category
  const getFilteredVehicles = () => {
    if (!vehicleType) return [];
    return vehicles.filter(v => {
      const typeMatch = v.vehicle_type.toLowerCase().includes(vehicleType.toLowerCase());
      const categoryMatch = !vehicleCategory || v.vehicle_category === vehicleCategory;
      return typeMatch && categoryMatch;
    });
  };

  const generateItinerary = () => {
    const numDays = parseInt(days);
    const numGuests = parseInt(guests) || 1;
    const budgetAmount = parseFloat(budget);
    
    if (!numDays || numDays < 1 || numDays > 30) {
      toast.error("Please enter a valid number of days (1-30)");
      return;
    }

    if (!numGuests || numGuests < 1) {
      toast.error("Please enter a valid number of guests");
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

    if (!hotelCategory) {
      toast.error("Please select a hotel category");
      return;
    }

    if (!vehicleType) {
      toast.error("Please select a vehicle type");
      return;
    }

    // Get destinations from database based on selected interests
    const interestCategories = selectedInterests.map(i => i.charAt(0).toUpperCase() + i.slice(1));
    const relevantDestinations = destinations.filter(d => 
      interestCategories.includes(d.interest_category)
    );

    // Get relevant cities from destinations
    const relevantCities = [...new Set(
      relevantDestinations.map(d => d.city).filter(Boolean)
    )] as string[];

    // Filter hotels by category and cities
    const categoryHotels = hotels.filter(h => 
      h.category === hotelCategory &&
      (relevantCities.length === 0 || relevantCities.includes(h.city))
    ).sort((a, b) => b.stars - a.stars);

    // If no hotels in relevant cities, get all hotels of the category
    const availableHotels = categoryHotels.length > 0 
      ? categoryHotels 
      : hotels.filter(h => h.category === hotelCategory).sort((a, b) => b.stars - a.stars);

    // Filter vehicles by type
    const typeVehicles = vehicles.filter(v => 
      v.vehicle_type.toLowerCase().includes(vehicleType.toLowerCase()) &&
      (!vehicleCategory || v.vehicle_category === vehicleCategory)
    ).sort((a, b) => a.per_km_charge - b.per_km_charge);

    if (availableHotels.length === 0) {
      toast.error(`No ${hotelCategory} hotels found. Try a different category.`);
      return;
    }

    if (typeVehicles.length === 0) {
      toast.error(`No ${vehicleType} vehicles found. Try a different type.`);
      return;
    }

    const chosenHotel = availableHotels[0];
    const chosenVehicle = typeVehicles[0];
    setSelectedHotel(chosenHotel);
    setSelectedVehicle(chosenVehicle);

    const plan: any[] = [];
    const avgKmPerDay = 100;
    let total = 0;

    for (let i = 0; i < numDays; i++) {
      const interest = selectedInterests[i % selectedInterests.length];
      const interestCategory = interest.charAt(0).toUpperCase() + interest.slice(1);
      
      // Get destinations for this interest from database
      const interestDestinations = relevantDestinations.filter(d => 
        d.interest_category === interestCategory
      );
      
      // Select destination for this day
      const destination = interestDestinations[i % Math.max(interestDestinations.length, 1)];
      const activity = destination 
        ? `Visit ${destination.name} - ${destination.description}`
        : `Explore ${interestCategory} attractions in Sri Lanka`;
      
      const dailyTransportCost = chosenVehicle.per_km_charge * avgKmPerDay;
      
      plan.push({
        day: i + 1,
        activity,
        destination: destination?.name || null,
        destinationCity: destination?.city || null,
        interest: interestCategory,
        hotel: chosenHotel.hotel_name,
        hotelCity: chosenHotel.city,
        hotelCost: chosenHotel.per_night_charge,
        hotelCategory: chosenHotel.category,
        transport: chosenVehicle.model,
        transportType: chosenVehicle.vehicle_type,
        transportCost: dailyTransportCost,
        dailyTotal: chosenHotel.per_night_charge + dailyTransportCost
      });
      
      total += chosenHotel.per_night_charge + dailyTransportCost;
    }

    setItinerary(plan);
    setTotalCost(total);
    toast.success("Itinerary generated successfully!");
  };

  const downloadPDF = () => {
    if (itinerary.length === 0) {
      toast.error("Generate an itinerary first");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(33, 37, 41);
    doc.text("Sri Lanka Travel Itinerary", pageWidth / 2, 25, { align: "center" });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(108, 117, 125);
    doc.text(`${days} Days | ${guests} Guest(s) | Budget: $${budget}`, pageWidth / 2, 35, { align: "center" });
    
    // Selected interests
    const selectedInterests = Object.entries(interests)
      .filter(([_, selected]) => selected)
      .map(([interest]) => interest.charAt(0).toUpperCase() + interest.slice(1))
      .join(", ");
    doc.text(`Interests: ${selectedInterests}`, pageWidth / 2, 42, { align: "center" });
    
    // Accommodation & Transport info
    doc.setFontSize(11);
    doc.setTextColor(33, 37, 41);
    doc.text(`Accommodation: ${selectedHotel?.hotel_name || 'N/A'} (${hotelCategory})`, 15, 55);
    doc.text(`Transport: ${selectedVehicle?.model || 'N/A'} (${vehicleType})`, 15, 62);
    
    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 68, pageWidth - 15, 68);
    
    let yPos = 78;
    
    itinerary.forEach((dayPlan, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 25;
      }
      
      // Day header
      doc.setFontSize(14);
      doc.setTextColor(25, 135, 84);
      doc.text(`Day ${dayPlan.day}`, 15, yPos);
      
      // Activity
      doc.setFontSize(11);
      doc.setTextColor(33, 37, 41);
      doc.text(dayPlan.activity, 15, yPos + 8);
      
      // Details
      doc.setFontSize(10);
      doc.setTextColor(108, 117, 125);
      doc.text(`Hotel: ${dayPlan.hotel} (${dayPlan.hotelCity}) - $${dayPlan.hotelCost.toFixed(2)}`, 15, yPos + 16);
      doc.text(`Transport: ${dayPlan.transport} - $${dayPlan.transportCost.toFixed(2)}`, 15, yPos + 23);
      doc.text(`Day Total: $${dayPlan.dailyTotal.toFixed(2)}`, 15, yPos + 30);
      
      yPos += 42;
    });
    
    // Total cost
    if (yPos > 250) {
      doc.addPage();
      yPos = 25;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos, pageWidth - 15, yPos);
    
    doc.setFontSize(16);
    doc.setTextColor(25, 135, 84);
    doc.text(`Total Estimated Cost: $${totalCost.toFixed(2)}`, pageWidth / 2, yPos + 12, { align: "center" });
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(108, 117, 125);
    doc.text("Generated by Sri Lanka Travel Planner", pageWidth / 2, 285, { align: "center" });
    
    doc.save(`sri-lanka-itinerary-${days}days.pdf`);
    toast.success("PDF downloaded successfully!");
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
      const { error } = await supabase.from("saved_itineraries").insert([{
        user_id: user.id,
        title: itineraryTitle,
        days: parseInt(days),
        guests: parseInt(guests),
        interests: interests as any,
        itinerary_data: {
          plan: itinerary,
          hotel: selectedHotel,
          vehicle: selectedVehicle,
          totalCost,
          hotelCategory,
          vehicleType,
          vehicleCategory,
        } as any,
      }]);

      if (error) throw error;
      toast.success("Itinerary saved successfully!");
      setItineraryTitle("");
      setSaveDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save itinerary");
    } finally {
      setSaving(false);
    }
  };

  const availableVehicleTypes = getAvailableVehicleTypes();

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
            {/* Basic Info */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days">Number of Days *</Label>
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
                <Label htmlFor="guests">Number of Guests *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    placeholder="How many guests?"
                    value={guests}
                    onChange={(e) => {
                      setGuests(e.target.value);
                      // Reset vehicle type if current selection is not available
                      const newGuestCount = parseInt(e.target.value) || 1;
                      if (newGuestCount > 7 && vehicleType !== "Bus") {
                        setVehicleType("Bus");
                      } else if (newGuestCount > 4 && vehicleType === "Car") {
                        setVehicleType("");
                      }
                    }}
                    className="pl-10 border-border"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget (USD) *</Label>
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

            {/* Interests */}
            <div className="space-y-3">
              <Label>What interests you? *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(interests).map((interest) => (
                  <div key={interest} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
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

            {/* Hotel Selection */}
            <div className="space-y-3">
              <Label>Hotel Category *</Label>
              <div className="grid grid-cols-3 gap-4">
                {["Low", "Middle", "Luxury"].map((category) => (
                  <div
                    key={category}
                    onClick={() => setHotelCategory(category)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      hotelCategory === category 
                        ? "border-primary bg-primary/10" 
                        : "hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium text-center">{category === "Low" ? "Budget" : category}</p>
                    <p className="text-xs text-muted-foreground text-center">
                      {category === "Low" && "Affordable stays"}
                      {category === "Middle" && "Comfortable options"}
                      {category === "Luxury" && "Premium experience"}
                    </p>
                  </div>
                ))}
              </div>
              {hotelCategory && (
                <p className="text-sm text-muted-foreground">
                  {getFilteredHotels().length} {hotelCategory.toLowerCase()} hotel(s) available
                </p>
              )}
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-3">
              <Label>Vehicle Type *</Label>
              {parseInt(guests) > 4 && (
                <p className="text-sm text-amber-600">
                  ⚠️ For {guests} guests, {parseInt(guests) > 7 ? "only Bus is" : "Van or Bus are"} recommended
                </p>
              )}
              <div className="grid grid-cols-3 gap-4">
                {availableVehicleTypes.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setVehicleType(type.value)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      vehicleType === type.value 
                        ? "border-primary bg-primary/10" 
                        : "hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium text-center">{type.value}</p>
                    <p className="text-xs text-muted-foreground text-center">{type.label.split("(")[1]?.replace(")", "")}</p>
                  </div>
                ))}
              </div>

              {vehicleType && (
                <div className="space-y-2">
                  <Label>Vehicle Class</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {["Mid", "Luxury"].map((category) => (
                      <div
                        key={category}
                        onClick={() => setVehicleCategory(category)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          vehicleCategory === category 
                            ? "border-primary bg-primary/10" 
                            : "hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium text-center">{category}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getFilteredVehicles().length} {vehicleType.toLowerCase()}(s) available
                  </p>
                </div>
              )}
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
                  
                  {/* Summary */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-background/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Accommodation</p>
                      <p className="font-medium">{selectedHotel?.hotel_name} ({hotelCategory})</p>
                      <p className="text-sm text-primary">${selectedHotel?.per_night_charge}/night</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transport</p>
                      <p className="font-medium">{selectedVehicle?.model} ({vehicleType})</p>
                      <p className="text-sm text-primary">${selectedVehicle?.per_km_charge}/km</p>
                    </div>
                  </div>

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

                <div className="flex gap-4">
                  <Button
                    onClick={downloadPDF}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  
                  {user ? (
                    <Button
                      onClick={() => setSaveDialogOpen(true)}
                      className="flex-1 bg-gradient-tropical text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Itinerary
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate("/auth")}
                      variant="outline"
                      className="flex-1"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign in to save
                    </Button>
                  )}
                </div>
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
