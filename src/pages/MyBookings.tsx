import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Hotel, User, CreditCard, Loader2, Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Booking {
  id: string;
  booking_type: string;
  subtotal: number;
  service_charge: number;
  total_amount: number;
  payment_method: string;
  booking_status: string;
  created_at: string;
  rental_start_date?: string;
  rental_end_date?: string;
  estimated_km?: number;
  vehicles?: { vehicle_type: string; model: string; vehicle_number: string };
  check_in_date?: string;
  check_out_date?: string;
  number_of_persons?: number;
  number_of_nights?: number;
  room_type?: string;
  hotels?: { hotel_name: string; city: string; stars: number };
}

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Review state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchExistingReviews();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, vehicles (vehicle_type, model, vehicle_number), hotels (hotel_name, city, stars)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("travel_reviews")
      .select("place_name")
      .eq("user_id", user.id);
    if (data) {
      setExistingReviews(new Set(data.map(r => r.place_name)));
    }
  };

  const getPlaceName = (booking: Booking) => {
    if (booking.booking_type === "vehicle") {
      return `Vehicle: ${booking.vehicles?.model || "Unknown"}`;
    }
    return `Hotel: ${booking.hotels?.hotel_name || "Unknown"}`;
  };

  const openReviewDialog = (booking: Booking) => {
    setReviewBooking(booking);
    setReviewRating(5);
    setReviewText("");
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!user || !reviewBooking) return;
    if (!reviewText.trim()) {
      toast.error("Please write a review");
      return;
    }
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("travel_reviews").insert({
        user_id: user.id,
        place_name: getPlaceName(reviewBooking),
        rating: reviewRating,
        review_text: reviewText.trim(),
        visit_date: reviewBooking.booking_type === "vehicle"
          ? reviewBooking.rental_start_date
          : reviewBooking.check_in_date,
      });
      if (error) throw error;
      toast.success("Review submitted successfully!");
      setReviewDialogOpen(false);
      setExistingReviews(prev => new Set([...prev, getPlaceName(reviewBooking)]));
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
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
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Bookings</h1>
          <p className="text-muted-foreground">View and manage all your travel bookings</p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-4">Start your journey by booking a vehicle or accommodation</p>
              <div className="flex gap-4">
                <Button onClick={() => navigate("/vehicle-rental")}><Car className="mr-2 h-4 w-4" />Book Vehicle</Button>
                <Button variant="outline" onClick={() => navigate("/accommodation")}><Hotel className="mr-2 h-4 w-4" />Book Hotel</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {booking.booking_type === "vehicle" ? <Car className="h-6 w-6 text-primary" /> : <Hotel className="h-6 w-6 text-primary" />}
                      <div>
                        <CardTitle className="text-xl">
                          {booking.booking_type === "vehicle"
                            ? `${booking.vehicles?.vehicle_type} - ${booking.vehicles?.model}`
                            : booking.hotels?.hotel_name}
                        </CardTitle>
                        <CardDescription>Booked on {format(new Date(booking.created_at), "MMM dd, yyyy")}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.booking_status)}>{booking.booking_status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {booking.booking_type === "vehicle" ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Rental Period:</span>
                          <span className="font-medium">{format(new Date(booking.rental_start_date!), "MMM dd")} - {format(new Date(booking.rental_end_date!), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Estimated KM:</span>
                          <span className="font-medium">{booking.estimated_km} km</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Vehicle Number:</span>
                          <span className="font-medium">{booking.vehicles?.vehicle_number}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Check-in to Check-out:</span>
                          <span className="font-medium">{format(new Date(booking.check_in_date!), "MMM dd")} - {format(new Date(booking.check_out_date!), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Hotel className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Room Type:</span>
                          <span className="font-medium">{booking.room_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Guests:</span>
                          <span className="font-medium">{booking.number_of_persons} person(s)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Nights:</span>
                          <span className="font-medium">{booking.number_of_nights}</span>
                        </div>
                        {booking.hotels && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-medium">{booking.hotels.city}</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="border-t pt-3 mt-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal:</span><span>USD {Number(booking.subtotal).toFixed(2)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service Charge (10%):</span><span>USD {Number(booking.service_charge).toFixed(2)}</span></div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total:</span><span className="text-primary">USD {Number(booking.total_amount).toFixed(2)}</span></div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          <span>Payment method: {booking.payment_method}</span>
                        </div>
                        {booking.booking_status === "confirmed" && !existingReviews.has(getPlaceName(booking)) && (
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openReviewDialog(booking)}>
                            <MessageSquare className="h-3.5 w-3.5" />
                            Review
                          </Button>
                        )}
                        {existingReviews.has(getPlaceName(booking)) && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Star className="h-3 w-3 fill-secondary text-secondary" /> Reviewed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Write a Review
            </DialogTitle>
          </DialogHeader>
          {reviewBooking && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-semibold">{getPlaceName(reviewBooking)}</p>
              </div>

              <div className="space-y-1.5">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)} className="p-1 hover:scale-110 transition-transform">
                      <Star className={`h-6 w-6 ${star <= reviewRating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Your Review *</Label>
                <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience..." rows={4} maxLength={1000} />
                <p className="text-xs text-muted-foreground">{reviewText.length}/1000</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitReview} disabled={submittingReview}>
              {submittingReview && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;
