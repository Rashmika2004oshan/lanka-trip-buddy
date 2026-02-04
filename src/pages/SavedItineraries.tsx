import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trash2, Loader2, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedItinerary {
  id: string;
  title: string;
  days: number;
  interests: string[];
  itinerary_data: any;
  created_at: string;
}

const SavedItineraries = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchItineraries();
    }
  }, [user]);

  const fetchItineraries = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_itineraries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItineraries((data || []) as SavedItinerary[]);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItinerary = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_itineraries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Itinerary deleted successfully");
      fetchItineraries();
    } catch (error) {
      console.error("Error deleting itinerary:", error);
      toast.error("Failed to delete itinerary");
    }
  };

  const parseInterests = (interests: any): string[] => {
    if (Array.isArray(interests)) return interests;
    if (typeof interests === 'string') {
      try {
        return JSON.parse(interests);
      } catch {
        return [];
      }
    }
    return [];
  };

  const downloadPDF = (itinerary: SavedItinerary) => {
    const doc = new jsPDF();
    const interests = parseInterests(itinerary.interests);
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(34, 139, 34);
    doc.text(itinerary.title, 20, 25);
    
    // Line separator
    doc.setDrawColor(34, 139, 34);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    
    // Trip Details
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Created: ${format(new Date(itinerary.created_at), "MMMM dd, yyyy")}`, 20, 40);
    doc.text(`Duration: ${itinerary.days} days`, 20, 48);
    
    // Interests
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Interests:", 20, 62);
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(interests.join(", "), 20, 70);
    
    let yPos = 85;
    
    // Destinations
    if (itinerary.itinerary_data?.destinations?.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Recommended Destinations:", 20, yPos);
      yPos += 10;
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      itinerary.itinerary_data.destinations.forEach((dest: any) => {
        doc.text(`• ${dest.name} - ${dest.description}`, 25, yPos);
        yPos += 8;
      });
      yPos += 5;
    }
    
    // Accommodation
    if (itinerary.itinerary_data?.hotel) {
      const hotel = itinerary.itinerary_data.hotel;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Accommodation:", 20, yPos);
      yPos += 10;
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`${hotel.hotel_name}`, 25, yPos);
      yPos += 7;
      doc.text(`Location: ${hotel.city}`, 25, yPos);
      yPos += 7;
      doc.text(`Category: ${hotel.category} | Stars: ${"★".repeat(hotel.stars)}`, 25, yPos);
      yPos += 7;
      doc.text(`Price: LKR ${hotel.per_night_charge}/night`, 25, yPos);
      yPos += 12;
    }
    
    // Transport
    if (itinerary.itinerary_data?.vehicle) {
      const vehicle = itinerary.itinerary_data.vehicle;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Transport:", 20, yPos);
      yPos += 10;
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`${vehicle.vehicle_type} - ${vehicle.model}`, 25, yPos);
      yPos += 7;
      doc.text(`Price: LKR ${vehicle.per_km_charge}/km`, 25, yPos);
      yPos += 12;
    }
    
    // Total Cost
    if (itinerary.itinerary_data?.totalCost) {
      doc.setFontSize(16);
      doc.setTextColor(34, 139, 34);
      doc.text(`Estimated Total: LKR ${Number(itinerary.itinerary_data.totalCost).toFixed(2)}`, 20, yPos);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by Lanka Trip Buddy", 20, 280);
    
    doc.save(`${itinerary.title.replace(/\s+/g, '-')}-itinerary.pdf`);
    toast.success("PDF downloaded successfully!");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Saved Itineraries</h1>
          <p className="text-muted-foreground">View and manage your planned trips</p>
        </div>

        {itineraries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No saved itineraries</h3>
              <p className="text-muted-foreground mb-4">Create a personalized travel plan to get started</p>
              <Button onClick={() => navigate("/")}>
                Create Itinerary
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {itineraries.map((itinerary) => (
              <Card key={itinerary.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{itinerary.title}</CardTitle>
                      <CardDescription>
                        Created on {format(new Date(itinerary.created_at), "MMM dd, yyyy")}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-primary hover:text-primary"
                        onClick={() => downloadPDF(itinerary)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Itinerary</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{itinerary.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItinerary(itinerary.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{itinerary.days} days</span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Interests:</p>
                      <div className="flex flex-wrap gap-2">
                        {parseInterests(itinerary.interests).map((interest: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {itinerary.itinerary_data?.hotel && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Accommodation</p>
                        <p className="text-sm text-muted-foreground">
                          {itinerary.itinerary_data.hotel.hotel_name} - {itinerary.itinerary_data.hotel.city}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          LKR {itinerary.itinerary_data.hotel.per_night_charge}/night
                        </p>
                      </div>
                    )}

                    {itinerary.itinerary_data?.vehicle && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Transport</p>
                        <p className="text-sm text-muted-foreground">
                          {itinerary.itinerary_data.vehicle.vehicle_type} - {itinerary.itinerary_data.vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          LKR {itinerary.itinerary_data.vehicle.per_km_charge}/km
                        </p>
                      </div>
                    )}

                    {itinerary.itinerary_data?.totalCost && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Estimated Total Cost:</span>
                          <span className="text-lg font-bold text-primary">
                            LKR {Number(itinerary.itinerary_data.totalCost).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedItineraries;
