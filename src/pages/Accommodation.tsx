import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import BookingDialog from "@/components/BookingDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { Hotel, Star, Plus } from "lucide-react";

interface HotelData {
  id: string;
  hotel_name: string;
  stars: number;
  per_night_charge: number;
  category: string;
  city: string;
  image_url: string | null;
}

const Accommodation = () => {
  const navigate = useNavigate();
  const { isHotelOwner } = useUserRole();
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Luxury':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Middle':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Accommodation
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find the perfect place to stay during your Sri Lankan journey
            </p>
            {isHotelOwner && (
              <Button onClick={() => navigate("/hotel-survey")} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                List Your Hotel
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading hotels...</p>
            </div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-12">
              <Hotel className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hotels available yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <Card key={hotel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {hotel.image_url ? (
                    <img
                      src={hotel.image_url}
                      alt={hotel.hotel_name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <Hotel className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {hotel.hotel_name}
                      </h3>
                      <Badge variant="outline" className={getCategoryColor(hotel.category)}>
                        {hotel.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: hotel.stars }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">
                      <span className="font-semibold">Location:</span> {hotel.city}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        USD {hotel.per_night_charge}/night
                      </span>
                      <Button 
                        onClick={() => {
                          setSelectedHotel(hotel);
                          setBookingDialogOpen(true);
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedHotel && (
        <BookingDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          bookingType="accommodation"
          itemData={selectedHotel}
        />
      )}
    </div>
  );
};

export default Accommodation;
