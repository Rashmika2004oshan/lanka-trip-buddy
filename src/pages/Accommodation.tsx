import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import BookingDialog from "@/components/BookingDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Hotel, Star, Plus, MessageSquare, Send, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface HotelData {
  id: string;
  hotel_name: string;
  stars: number;
  per_night_charge: number;
  category: string;
  city: string;
  image_url: string | null;
}

interface Review {
  id: string;
  user_id: string;
  place_name: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer_name?: string | null;
}

const Accommodation = () => {
  const navigate = useNavigate();
  const { isHotelOwner } = useUserRole();
  const { user } = useAuth();
  const { t } = useI18n();
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);

  // Review state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewHotel, setReviewHotel] = useState<HotelData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const openReviewDialog = async (hotel: HotelData) => {
    setReviewHotel(hotel);
    setReviewDialogOpen(true);
    setNewRating(5);
    setNewReviewText("");
    setReviewsLoading(true);
    try {
      const { data } = await supabase
        .from("travel_reviews")
        .select("*")
        .eq("place_name", `hotel:${hotel.id}`)
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
        setReviews(data.map(r => ({ ...r, reviewer_name: profileMap.get(r.user_id) || null })));
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user || !reviewHotel) return;
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("travel_reviews").insert({
        user_id: user.id,
        place_name: `hotel:${reviewHotel.id}`,
        rating: newRating,
        review_text: newReviewText || null,
      });
      if (error) throw error;
      toast.success("Review submitted!");
      setNewReviewText("");
      setNewRating(5);
      // Refresh reviews
      const { data } = await supabase
        .from("travel_reviews")
        .select("*")
        .eq("place_name", `hotel:${reviewHotel.id}`)
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
        setReviews(data.map(r => ({ ...r, reviewer_name: profileMap.get(r.user_id) || null })));
      } else {
        setReviews([]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
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

  const getAvgRating = (hotelId: string) => {
    // We don't preload all reviews, so this is a placeholder
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t("nav.hotels")}
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(hotel)}
                          className="gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {t("review.reviews")}
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedHotel(hotel);
                            setBookingDialogOpen(true);
                          }}
                        >
                          {t("booking.bookNow")}
                        </Button>
                      </div>
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {t("review.reviews")} — {reviewHotel?.hotel_name}
            </DialogTitle>
          </DialogHeader>

          {/* Submit Review (only for logged-in users) */}
          {user && (
            <div className="space-y-3 border-b border-border/50 pb-4">
              <p className="text-sm font-medium text-foreground">{t("review.leaveReview")}</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setNewRating(s)} className="focus:outline-none">
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        s <= newRating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">{newRating}/5</span>
              </div>
              <Textarea
                placeholder={t("review.yourReview")}
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                rows={3}
              />
              <Button onClick={submitReview} disabled={submittingReview} size="sm" className="gap-1.5">
                {submittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {t("review.submitReview")}
              </Button>
            </div>
          )}

          {/* Existing Reviews */}
          <div className="space-y-3 pt-2">
            {reviewsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t("review.noReviews")}</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {r.profiles?.full_name || "Anonymous"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < r.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  {r.review_text && (
                    <p className="text-sm text-muted-foreground">{r.review_text}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accommodation;
