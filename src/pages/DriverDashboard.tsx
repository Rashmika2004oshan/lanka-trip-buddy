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
import { Car, Calendar, Clock, CheckCircle, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface VehicleBooking {
  id: string;
  rental_start_date: string;
  rental_end_date: string;
  estimated_km: number;
  subtotal: number;
  service_charge: number;
  total_amount: number;
  booking_status: string;
  created_at: string;
  vehicles: {
    id: string;
    model: string;
    vehicle_type: string;
    vehicle_number: string;
  };
}

const DriverDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDriver, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [currentBookings, setCurrentBookings] = useState<VehicleBooking[]>([]);
  const [pastBookings, setPastBookings] = useState<VehicleBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isDriver) {
        navigate("/");
        toast.error("Access denied. Driver privileges required.");
      }
    }
  }, [user, isDriver, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (isDriver && user) {
      fetchDriverData();
    }
  }, [isDriver, user]);

  const fetchDriverData = async () => {
    if (!user) return;
    
    try {
      // Fetch driver's vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id);

      setVehicles(vehiclesData || []);

      if (vehiclesData && vehiclesData.length > 0) {
        const vehicleIds = vehiclesData.map(v => v.id);
        
        // Fetch bookings for driver's vehicles
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select(`*, vehicles(id, model, vehicle_type, vehicle_number)`)
          .in("vehicle_id", vehicleIds)
          .order("created_at", { ascending: false });

        const today = new Date();
        const current: VehicleBooking[] = [];
        const past: VehicleBooking[] = [];

        (bookingsData || []).forEach((booking: any) => {
          if (booking.vehicles) {
            const endDate = new Date(booking.rental_end_date);
            if (endDate >= today) {
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
      console.error("Error fetching driver data:", error);
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

  if (!isDriver) {
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
                <Car className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold text-foreground">Driver Dashboard</h1>
              </div>
              <p className="text-muted-foreground">Manage your vehicles and view bookings</p>
            </div>
            <Button onClick={() => navigate("/driver-survey")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Car className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{vehicles.length}</p>
                  <p className="text-sm text-muted-foreground">My Vehicles</p>
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
                  <p className="text-sm text-muted-foreground">Active Bookings</p>
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
            <TabsTrigger value="current">Current Bookings</TabsTrigger>
            <TabsTrigger value="past">Past Bookings</TabsTrigger>
            <TabsTrigger value="vehicles">My Vehicles</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <Card>
              <CardHeader>
                <CardTitle>Current & Upcoming Bookings</CardTitle>
                <CardDescription>Active vehicle rentals from guests</CardDescription>
              </CardHeader>
              <CardContent>
                {currentBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No current bookings</p>
                ) : (
                  <div className="space-y-4">
                    {currentBookings.map((booking) => (
                      <div key={booking.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-primary" />
                            <span className="font-medium">{booking.vehicles.model}</span>
                            <span className="text-sm text-muted-foreground">({booking.vehicles.vehicle_number})</span>
                          </div>
                          <Badge className="bg-green-500">{booking.booking_status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(booking.rental_start_date), "MMM dd")} - {format(new Date(booking.rental_end_date), "MMM dd, yyyy")}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Est. KM:</span> {booking.estimated_km}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-primary mt-2">
                          Earning: LKR {Number(booking.subtotal).toFixed(2)}
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
                <CardTitle>Past Bookings</CardTitle>
                <CardDescription>Completed vehicle rentals</CardDescription>
              </CardHeader>
              <CardContent>
                {pastBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No past bookings</p>
                ) : (
                  <div className="space-y-4">
                    {pastBookings.map((booking) => (
                      <div key={booking.id} className="p-4 border rounded-lg opacity-75">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{booking.vehicles.model}</span>
                          </div>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.rental_start_date), "MMM dd")} - {format(new Date(booking.rental_end_date), "MMM dd, yyyy")}
                        </p>
                        <p className="text-sm font-medium text-primary mt-1">
                          Earned: LKR {Number(booking.subtotal).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle>My Vehicles</CardTitle>
                <CardDescription>Your listed vehicles</CardDescription>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No vehicles listed yet</p>
                    <Button onClick={() => navigate("/driver-survey")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Vehicle
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="p-4 border rounded-lg">
                        {vehicle.image_url && (
                          <img src={vehicle.image_url} alt={vehicle.model} className="w-full h-32 object-cover rounded mb-3" />
                        )}
                        <h4 className="font-medium">{vehicle.model}</h4>
                        <p className="text-sm text-muted-foreground">{vehicle.vehicle_type} | {vehicle.vehicle_number}</p>
                        <p className="text-sm font-medium text-primary">LKR {vehicle.per_km_charge}/km</p>
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

export default DriverDashboard;
