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
import { Car, Calendar, Clock, CheckCircle, Loader2, Plus, User, CreditCard, DollarSign, Trash2 } from "lucide-react";
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
  payment_method: string;
  created_at: string;
  user_id: string;
  vehicles: {
    id: string;
    model: string;
    vehicle_type: string;
    vehicle_number: string;
    per_km_charge: number;
  };
  clientName?: string;
  clientEmail?: string;
}

const DriverDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDriver, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [currentBookings, setCurrentBookings] = useState<VehicleBooking[]>([]);
  const [pastBookings, setPastBookings] = useState<VehicleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

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
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id);

      setVehicles(vehiclesData || []);

      if (vehiclesData && vehiclesData.length > 0) {
        const vehicleIds = vehiclesData.map(v => v.id);
        
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select(`*, vehicles(id, model, vehicle_type, vehicle_number, per_km_charge)`)
          .in("vehicle_id", vehicleIds)
          .order("created_at", { ascending: false });

        // Fetch client profiles for all bookings
        const clientIds = [...new Set((bookingsData || []).map((b: any) => b.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", clientIds);
        
        const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

        const today = new Date();
        const current: VehicleBooking[] = [];
        const past: VehicleBooking[] = [];
        let earnings = 0;

        (bookingsData || []).forEach((booking: any) => {
          if (booking.vehicles) {
            const enriched = {
              ...booking,
              clientName: profileMap.get(booking.user_id) || "Guest",
            };
            const endDate = new Date(booking.rental_end_date);
            if (endDate >= today) {
              current.push(enriched);
            } else {
              past.push(enriched);
            }
            earnings += Number(booking.subtotal);
          }
        });

        setCurrentBookings(current);
        setPastBookings(past);
        setTotalEarnings(earnings);
      }
    } catch (error) {
      console.error("Error fetching driver data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
      if (error) throw error;
      toast.success("Vehicle deleted");
      fetchDriverData();
    } catch (error: any) {
      toast.error(error.message);
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

  if (!isDriver) return null;

  const BookingCard = ({ booking, isPast }: { booking: VehicleBooking; isPast?: boolean }) => (
    <div className={`p-4 border rounded-lg space-y-3 ${isPast ? "opacity-75" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          <span className="font-medium">{booking.vehicles.model}</span>
          <span className="text-sm text-muted-foreground">({booking.vehicles.vehicle_number})</span>
        </div>
        <Badge className={isPast ? "" : "bg-green-500"} variant={isPast ? "secondary" : "default"}>
          {isPast ? "Completed" : booking.booking_status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Client:</span>
          <span className="font-medium">{booking.clientName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(booking.rental_start_date), "MMM dd")} - {format(new Date(booking.rental_end_date), "MMM dd, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Est. KM:</span>
          <span className="font-medium">{booking.estimated_km}</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Payment:</span>
          <span className="font-medium">{booking.payment_method}</span>
        </div>
      </div>
      
      <div className="border-t pt-2 flex justify-between text-sm">
        <div className="space-y-1">
          <p><span className="text-muted-foreground">Subtotal:</span> USD {Number(booking.subtotal).toFixed(2)}</p>
          <p><span className="text-muted-foreground">Service Charge:</span> USD {Number(booking.service_charge).toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">USD {Number(booking.total_amount).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Amount</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Booked on {format(new Date(booking.created_at), "MMM dd, yyyy 'at' hh:mm a")}</p>
    </div>
  );

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
              <p className="text-muted-foreground">Manage your vehicles and view client bookings</p>
            </div>
            <Button onClick={() => navigate("/driver-survey")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">USD {totalEarnings.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="current" className="space-y-4">
          <TabsList>
            <TabsTrigger value="current">Current Bookings ({currentBookings.length})</TabsTrigger>
            <TabsTrigger value="past">Past Bookings ({pastBookings.length})</TabsTrigger>
            <TabsTrigger value="vehicles">My Vehicles ({vehicles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <Card>
              <CardHeader>
                <CardTitle>Current & Upcoming Bookings</CardTitle>
                <CardDescription>Active vehicle rentals from clients with full details</CardDescription>
              </CardHeader>
              <CardContent>
                {currentBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No current bookings</p>
                ) : (
                  <div className="space-y-4">
                    {currentBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
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
                      <BookingCard key={booking.id} booking={booking} isPast />
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
                        <p className="text-sm text-muted-foreground">Category: {vehicle.vehicle_category || "Mid"}</p>
                        <p className="text-sm font-medium text-primary">USD {vehicle.per_km_charge}/km</p>
                        <Button variant="destructive" size="sm" className="mt-2" onClick={() => handleDeleteVehicle(vehicle.id)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
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
