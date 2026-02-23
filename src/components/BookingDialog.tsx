import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingType: "vehicle" | "accommodation";
  itemData: any;
}

const BookingDialog = ({ open, onOpenChange, bookingType, itemData }: BookingDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Vehicle booking fields
  const [rentalStartDate, setRentalStartDate] = useState<Date>();
  const [rentalEndDate, setRentalEndDate] = useState<Date>();
  const [estimatedKm, setEstimatedKm] = useState("");
  
  // Accommodation booking fields
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [numberOfPersons, setNumberOfPersons] = useState("1");
  const [roomType, setRoomType] = useState("");
  
  // Payment confirmation checkbox
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const calculateSubtotal = () => {
    if (bookingType === "vehicle") {
      const km = parseFloat(estimatedKm) || 0;
      return km * parseFloat(itemData.per_km_charge);
    } else {
      if (!checkInDate || !checkOutDate) return 0;
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      return nights * parseFloat(itemData.per_night_charge);
    }
  };

  const subtotal = calculateSubtotal();
  const serviceCharge = subtotal * 0.1;
  const totalAmount = subtotal + serviceCharge;

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
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

    if (bookingType === "accommodation" && (!checkInDate || !checkOutDate || !roomType)) {
      toast.error("Please fill in all accommodation details");
      return;
    }

    setLoading(true);

    try {
      // Get user profile for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Create booking
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
        }),
      };

      const { error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingData);

      if (bookingError) throw bookingError;

      // Send email notification to admin
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
        subtotal: subtotal.toFixed(2),
        serviceCharge: serviceCharge.toFixed(2),
        ownerEmail: itemData.owner_email,
      };

      await supabase.functions.invoke("send-booking-notification", {
        body: {
          bookingType,
          bookingDetails,
          customerEmail: user.email,
          customerName: profile?.full_name || "Guest",
          totalAmount: totalAmount.toFixed(2),
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
                      <Calendar
                        mode="single"
                        selected={rentalStartDate}
                        onSelect={setRentalStartDate}
                        disabled={(date) => date < new Date()}
                      />
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
                      <Calendar
                        mode="single"
                        selected={rentalEndDate}
                        onSelect={setRentalEndDate}
                        disabled={(date) => date < (rentalStartDate || new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedKm">Estimated Kilometers *</Label>
                <Input
                  id="estimatedKm"
                  type="number"
                  placeholder="Enter estimated km"
                  value={estimatedKm}
                  onChange={(e) => setEstimatedKm(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Rate: USD {itemData.per_km_charge}/km
                </p>
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
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        onSelect={setCheckInDate}
                        disabled={(date) => date < new Date()}
                      />
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
                      <Calendar
                        mode="single"
                        selected={checkOutDate}
                        onSelect={setCheckOutDate}
                        disabled={(date) => date < (checkInDate || new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="persons">Number of Persons *</Label>
                  <Input
                    id="persons"
                    type="number"
                    min="1"
                    value={numberOfPersons}
                    onChange={(e) => setNumberOfPersons(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Type *</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Double">Double</SelectItem>
                      <SelectItem value="Suite">Suite</SelectItem>
                      <SelectItem value="Family">Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {checkInDate && checkOutDate && (
                <p className="text-sm text-muted-foreground">
                  Number of nights: {calculateNights()} | Rate: USD {itemData.per_night_charge}/night
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
                <input
                  type="checkbox"
                  id="paymentConfirm"
                  checked={paymentConfirmed}
                  onChange={(e) => setPaymentConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="paymentConfirm" className="text-sm font-normal">
                  I confirm that I want to proceed with this booking (Demo payment)
                </Label>
              </div>
            </div>
          </div>

          <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>USD {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Service Charge (10%):</span>
              <span>USD {serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total Amount:</span>
              <span className="text-primary">USD {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleBooking} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
