import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Calendar, Clock, CheckCircle, Loader2, Plus, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface HotelBooking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_persons: number;
  number_of_nights: number;
  room_type: string;
  subtotal: number;
  service_charge: number;
  total_amount: number;
  booking_status: string;
  created_at: string;
  hotels: {
    id: string;
    hotel_name: string;
    city: string;
    stars: number;
  };
}

const HotelOwnerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isHotelOwner, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  
  const [hotels, setHotels] = useState<any[]>([]);
  const [currentBookings, setCurrentBookings] = useState<HotelBooking[]>([]);
  const [pastBookings, setPastBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isHotelOwner) {
        navigate("/");
        toast.error("Access denied. Hotel owner privileges required.");
      }
    }
  }, [user, isHotelOwner, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (isHotelOwner && user) {
      fetchHotelData();
    }
  }, [isHotelOwner, user]);

  const fetchHotelData = async () => {
    if (!user) return;
    
    try {
      // Fetch owner's hotels
      const { data: hotelsData } = await supabase
        .from("hotels")
        .select("*")
        .eq("user_id", user.id);

      setHotels(hotelsData || []);

      if (hotelsData && hotelsData.length > 0) {
        const hotelIds = hotelsData.map(h => h.id);
        
        // Fetch bookings for owner's hotels
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select(`*, hotels(id, hotel_name, city, stars)`)
          .in("hotel_id", hotelIds)
          .order("created_at", { ascending: false });

        const today = new Date();
        const current: HotelBooking[] = [];
        const past: HotelBooking[] = [];

        (bookingsData || []).forEach((booking: any) => {
          if (booking.hotels) {
            const checkoutDate = new Date(booking.check_out_date);
            if (checkoutDate >= today) {
              current.push(booking);
            } else {
              past.push(booking);
            }
          }
        });

        setCurrentBookings(current);
        setPastBookings(past);
      }
    } catch (error) {
      console.error("Error fetching hotel data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isHotelOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Hotel className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold text-foreground">Hotel Owner Dashboard</h1>
              </div>
              <p className="text-muted-foreground">Manage your hotels and view reservations</p>
            </div>
            <Button onClick={() => navigate("/hotel-survey")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hotel
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Hotel className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{hotels.length}</p>
                  <p className="text-sm text-muted-foreground">My Hotels</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{currentBookings.length}</p>
                  <p className="text-sm text-muted-foreground">Active Reservations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{pastBookings.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="current" className="space-y-4">
          <TabsList>
            <TabsTrigger value="current">Current Reservations</TabsTrigger>
            <TabsTrigger value="past">Past Reservations</TabsTrigger>
            <TabsTrigger value="hotels">My Hotels</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <Card>
              <CardHeader>
                <CardTitle>Current & Upcoming Reservations</CardTitle>
                <CardDescription>Active hotel bookings from guests</CardDescription>
              </CardHeader>
              <CardContent>
                {currentBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No current reservations</p>
                ) : (
                  <div className="space-y-4">
                    {currentBookings.map((booking) => (
                      <div key={booking.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Hotel className="h-5 w-5 text-primary" />
                            <span className="font-medium">{booking.hotels.hotel_name}</span>
                            <span className="text-sm text-muted-foreground">({booking.hotels.city})</span>
                          </div>
                          <Badge className="bg-green-500">{booking.booking_status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(booking.check_in_date), "MMM dd")} - {format(new Date(booking.check_out_date), "MMM dd, yyyy")}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Guests:</span> {booking.number_of_persons} | <span className="text-muted-foreground">Room:</span> {booking.room_type}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-primary mt-2">
                          Earning: USD {Number(booking.subtotal).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle>Past Reservations</CardTitle>
                <CardDescription>Completed hotel stays</CardDescription>
              </CardHeader>
              <CardContent>
                {pastBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No past reservations</p>
                ) : (
                  <div className="space-y-4">
                    {pastBookings.map((booking) => (
                      <div key={booking.id} className="p-4 border rounded-lg opacity-75">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Hotel className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{booking.hotels.hotel_name}</span>
                          </div>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.check_in_date), "MMM dd")} - {format(new Date(booking.check_out_date), "MMM dd, yyyy")}
                        </p>
                        <p className="text-sm font-medium text-primary mt-1">
                          Earned: USD {Number(booking.subtotal).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hotels">
            <Card>
              <CardHeader>
                <CardTitle>My Hotels</CardTitle>
                <CardDescription>Your listed properties</CardDescription>
              </CardHeader>
              <CardContent>
                {hotels.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No hotels listed yet</p>
                    <Button onClick={() => navigate("/hotel-survey")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Hotel
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotels.map((hotel) => (
                      <div key={hotel.id} className="p-4 border rounded-lg">
                        {hotel.image_url && (
                          <img src={hotel.image_url} alt={hotel.hotel_name} className="w-full h-32 object-cover rounded mb-3" />
                        )}
                        <h4 className="font-medium">{hotel.hotel_name}</h4>
                        <div className="flex items-center gap-1 my-1">
                          {Array.from({ length: hotel.stars }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{hotel.city} | {hotel.category}</p>
                        <p className="text-sm font-medium text-primary">USD {hotel.per_night_charge}/night</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HotelOwnerDashboard;
