import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import BookingDialog from "@/components/BookingDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useI18n } from "@/lib/i18n";
import { Car, Plus } from "lucide-react";

interface Vehicle {
  id: string;
  vehicle_type: string;
  model: string;
  vehicle_number: string;
  per_km_charge: number;
  image_url: string | null;
}

const VehicleRental = () => {
  const navigate = useNavigate();
  const { isDriver } = useUserRole();
  const { t } = useI18n();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);

      // Extract unique vehicle types
      const types = [...new Set((data || []).map(v => v.vehicle_type))];
      setVehicleTypes(types.sort());
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const filteredVehicles = selectedTypes.length === 0
    ? vehicles
    : vehicles.filter(vehicle => selectedTypes.includes(vehicle.vehicle_type));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 animate-in fade-in slide-in-from-bottom-6 duration-800 delay-200">
              {t("vehicles.title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-600 delay-400">
              {t("vehicles.subtitle")}
            </p>
            {isDriver && (
              <Button onClick={() => navigate("/driver-survey")} className="mt-4 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-600 hover:scale-105 transition-transform duration-300">
                <Plus className="h-4 w-4" />
                {t("vehicles.listVehicle")}
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-muted-foreground">{t("vehicles.loading")}</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-in fade-in slide-in-from-top-4 duration-300 delay-200" />
              <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-400 delay-400">{t("vehicles.noVehicles")}</p>
            </div>
          ) : (
            <>
              <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <h2 className="text-lg font-semibold text-foreground mb-4">Filter by Vehicle Type</h2>
                <div className="flex flex-wrap gap-3">
                  {vehicleTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 border ${
                        selectedTypes.includes(type)
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 border-current'
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {filteredVehicles.length === 0 ? (
                <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-in fade-in slide-in-from-top-4 duration-300 delay-200" />
                  <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-400 delay-400">No vehicles found in selected categories</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVehicles.map((vehicle, index) => (
                <Card key={vehicle.id} className={`overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-${(index + 1) * 200}`}>
                  {vehicle.image_url ? (
                    <img
                      src={vehicle.image_url}
                      alt={vehicle.model}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center transition-colors duration-300 group-hover:bg-muted/80">
                      <Car className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2 animate-in fade-in slide-in-from-left-2 duration-500 delay-${(index + 1) * 300}">
                      {vehicle.model}
                    </h3>
                    <p className="text-muted-foreground mb-1 animate-in fade-in slide-in-from-left-1 duration-400 delay-${(index + 1) * 400}">{t("vehicles.type")}: {vehicle.vehicle_type}</p>
                    <p className="text-muted-foreground mb-4 animate-in fade-in slide-in-from-left-1 duration-400 delay-${(index + 1) * 500}">{t("vehicles.number")}: {vehicle.vehicle_number}</p>
                    <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-600 delay-${(index + 1) * 600}">
                      <span className="text-2xl font-bold text-primary">
                        USD {vehicle.per_km_charge}{t("vehicles.perKm")}
                      </span>
                      <Button 
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setBookingDialogOpen(true);
                        }}
                        className="hover:scale-105 transition-transform duration-300"
                      >
                        {t("booking.bookNow")}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedVehicle && (
        <BookingDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          bookingType="vehicle"
          itemData={selectedVehicle}
        />
      )}
    </div>
  );
};

export default VehicleRental;
