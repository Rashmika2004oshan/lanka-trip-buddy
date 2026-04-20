import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CalendarIcon, AlertTriangle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";

interface VehicleData {
  id: string;
  vehicle_type: string;
  model: string;
  per_km_charge: number;
  owner_email: string | null;
}

interface AccommodationData {
  id: string;
  hotel_name: string;
  per_night_charge: number;
  owner_email: string | null;
  stars?: number;
  category?: string;
  city?: string;
  image_url?: string | null;
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingType: "vehicle" | "accommodation";
  itemData: bookingType extends "vehicle" ? VehicleData : AccommodationData;
}

const BookingDialog = ({ open, onOpenChange, bookingType, itemData }: BookingDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Vehicle booking fields
  const [rentalStartDate, setRentalStartDate] = useState<Date>();
  const [rentalEndDate, setRentalEndDate] = useState<Date>();
  const [estimatedKm, setEstimatedKm] = useState("");

  // Accommodation booking fields
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [numberOfPersons, setNumberOfPersons] = useState("1");
  const [roomType, setRoomType] = useState("");
  const [boardType, setBoardType] = useState("");

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const calculateSubtotal = () => {
    if (bookingType === "vehicle") {
      const km = parseFloat(estimatedKm) || 0;
      return km * parseFloat(itemData.per_km_charge);
    } else {
      if (!checkInDate || !checkOutDate) return 0;
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      let baseCharge = parseFloat(itemData.per_night_charge);
      
      // Apply extra charges for room types only for Full Board
      if (boardType === "Full Board") {
        if (roomType === "Double") {
          baseCharge *= 1.2; // 20% extra
        } else if (roomType === "Family") {
          baseCharge *= 1.4; // 40% extra
        }
        // Single and Suite remain at normal charge
      }
      
      // Apply board type surcharges for all hotels
      if (boardType === "Bed Only") {
        baseCharge *= 1.05; // 5% extra
      } else if (boardType === "Half Board") {
        baseCharge *= 1.08; // 8% extra
      } else if (boardType === "Full Board") {
        baseCharge *= 1.12; // 12% extra
      }
      
      return nights * baseCharge;
    }
  };

  const subtotal = calculateSubtotal();
  const serviceCharge = subtotal * 0.1;
  const totalAmount = subtotal + serviceCharge;

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Check vehicle availability
  const checkVehicleAvailability = async (startDate: Date, endDate: Date) => {
    if (bookingType !== "vehicle") return true;
    setCheckingAvailability(true);
    setAvailabilityError(null);
    try {
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      const { data: conflicting } = await supabase
        .from("bookings")
        .select("id")
        .eq("vehicle_id", itemData.id)
        .eq("booking_status", "confirmed")
        .lte("rental_start_date", endStr)
        .gte("rental_end_date", startStr);

      if (conflicting && conflicting.length > 0) {
        setAvailabilityError(t("booking.alreadyBooked"));
        return false;
      }
      return true;
    } catch {
      return true;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleStartDateChange = async (date: Date | undefined) => {
    setRentalStartDate(date);
    setAvailabilityError(null);
    if (date && rentalEndDate) {
      await checkVehicleAvailability(date, rentalEndDate);
    }
  };

  const handleEndDateChange = async (date: Date | undefined) => {
    setRentalEndDate(date);
    setAvailabilityError(null);
    if (rentalStartDate && date) {
      await checkVehicleAvailability(rentalStartDate, date);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please sign in to make a booking");
      navigate("/auth");
      return;
    }

    if (!paymentConfirmed) {
      toast.error("Please confirm payment to proceed");
      return;
    }

    if (bookingType === "vehicle" && (!rentalStartDate || !rentalEndDate || !estimatedKm)) {
      toast.error("Please fill in all vehicle rental details");
      return;
    }

    if (bookingType === "accommodation" && (!checkInDate || !checkOutDate || !roomType || !boardType)) {
      toast.error("Please fill in all accommodation details");
      return;
    }

    // Final availability check for vehicles
    if (bookingType === "vehicle" && rentalStartDate && rentalEndDate) {
      const available = await checkVehicleAvailability(rentalStartDate, rentalEndDate);
      if (!available) return;
    }

    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const bookingData = {
        user_id: user.id,
        booking_type: bookingType,
        subtotal,
        service_charge: serviceCharge,
        total_amount: totalAmount,
        payment_method: "card",
        booking_status: "confirmed",
        ...(bookingType === "vehicle" ? {
          vehicle_id: itemData.id,
          rental_start_date: rentalStartDate?.toISOString().split('T')[0],
          rental_end_date: rentalEndDate?.toISOString().split('T')[0],
          estimated_km: parseFloat(estimatedKm),
        } : {
          hotel_id: itemData.id,
          check_in_date: checkInDate?.toISOString().split('T')[0],
          check_out_date: checkOutDate?.toISOString().split('T')[0],
          number_of_persons: parseInt(numberOfPersons),
          number_of_nights: calculateNights(),
          room_type: roomType,
          board_type: boardType,
        }),
      };

      const { error: bookingError } = await supabase.from("bookings").insert(bookingData);
      if (bookingError) throw bookingError;

      const bookingDetails = bookingType === "vehicle" ? {
        vehicleModel: itemData.model,
        vehicleType: itemData.vehicle_type,
        rentalStartDate: format(rentalStartDate!, "MMM dd, yyyy"),
        rentalEndDate: format(rentalEndDate!, "MMM dd, yyyy"),
        estimatedKm,
        subtotal: subtotal.toFixed(2),
        serviceCharge: serviceCharge.toFixed(2),
        ownerEmail: itemData.owner_email,
      } : {
        hotelName: itemData.hotel_name,
        city: itemData.city,
        checkInDate: format(checkInDate!, "MMM dd, yyyy"),
        checkOutDate: format(checkOutDate!, "MMM dd, yyyy"),
        numberOfNights: calculateNights(),
        numberOfPersons,
        roomType,
        boardType,
        subtotal: subtotal.toFixed(2),
        serviceCharge: serviceCharge.toFixed(2),
        ownerEmail: itemData.owner_email,
      };

const { data: { session } } = await supabase.auth.getSession();

await supabase.functions.invoke("send-booking-notification", {
  body: {
    bookingType,
    bookingDetails,
    customerEmail: user.email,
    customerName: profile?.full_name || "Guest",
    totalAmount: totalAmount.toFixed(2),
  },
  headers: {
    Authorization: `Bearer ${session?.access_token}`,
  },
});

      toast.success("Booking confirmed! Admin has been notified.");
      onOpenChange(false);
      navigate("/my-bookings");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>
            {bookingType === "vehicle"
              ? `Book ${itemData.vehicle_type} - ${itemData.model}`
              : `Book ${itemData.hotel_name}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {bookingType === "vehicle" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rental Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {rentalStartDate ? format(rentalStartDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={rentalStartDate} onSelect={handleStartDateChange} disabled={(date) => date < new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Rental End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {rentalEndDate ? format(rentalEndDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={rentalEndDate} onSelect={handleEndDateChange} disabled={(date) => date < (rentalStartDate || new Date())} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Availability error */}
              {availabilityError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {availabilityError}
                </div>
              )}

              {checkingAvailability && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking availability...
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="estimatedKm">Estimated Kilometers *</Label>
                <Input id="estimatedKm" type="number" placeholder="Enter estimated km" value={estimatedKm} onChange={(e) => setEstimatedKm(e.target.value)} />
                <p className="text-xs text-muted-foreground">Rate: USD {itemData.per_km_charge}/km</p>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check-in Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkInDate ? format(checkInDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={checkInDate} onSelect={setCheckInDate} disabled={(date) => date < new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Check-out Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOutDate ? format(checkOutDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={checkOutDate} onSelect={setCheckOutDate} disabled={(date) => date < (checkInDate || new Date())} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="persons">Number of Persons *</Label>
                  <Input id="persons" type="number" min="1" value={numberOfPersons} onChange={(e) => setNumberOfPersons(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boardType">Board Type *</Label>
                  <Select value={boardType} onValueChange={setBoardType}>
                    <SelectTrigger><SelectValue placeholder="Select board type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Board">Full Board</SelectItem>
                      <SelectItem value="Half Board">Half Board</SelectItem>
                      <SelectItem value="Bed Only">Bed Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Type *</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger><SelectValue placeholder="Select room type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Double">Double</SelectItem>
                      <SelectItem value="Family">Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {/* Empty div for grid balance */}
                </div>
              </div>
              {checkInDate && checkOutDate && (
                <p className="text-sm text-muted-foreground">
                  Number of nights: {calculateNights()} | Base rate: USD {itemData.per_night_charge}/night
                  {boardType === "Full Board" && roomType === "Double" && " (+20% for Double room)"}
                  {boardType === "Full Board" && roomType === "Family" && " (+40% for Family room)"}
                  {boardType === "Bed Only" && " (+5% for Bed Only)"}
                  {boardType === "Half Board" && " (+8% for Half Board)"}
                  {boardType === "Full Board" && " (+12% for Full Board)"}
                </p>
              )}
            </>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Payment Confirmation</h3>
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Demo Mode:</strong> This is a demonstration system. No actual payment will be processed.
                  Click the checkbox below to simulate payment confirmation.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="paymentConfirm" checked={paymentConfirmed} onChange={(e) => setPaymentConfirmed(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor="paymentConfirm" className="text-sm font-normal">
                  I confirm that I want to proceed with this booking (Demo payment)
                </Label>
              </div>
            </div>
          </div>

          <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal:</span><span>USD {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Service Charge (10%):</span><span>USD {serviceCharge.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total Amount:</span><span className="text-primary">USD {totalAmount.toFixed(2)}</span></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>{t("booking.cancel")}</Button>
          <Button onClick={handleBooking} disabled={loading || !!availabilityError}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("booking.confirmBooking")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
