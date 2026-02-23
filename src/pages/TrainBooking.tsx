import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Train, ArrowRight, Clock, MapPin, Info, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const STATIONS = ["Colombo", "Kandy", "Hatton", "Nanuoya", "Ella"];

// Train schedule data - realistic Sri Lanka train routes
const TRAIN_SCHEDULES: Record<string, Record<string, { trains: TrainOption[] }>> = {
  Colombo: {
    Kandy: {
      trains: [
        { name: "Podi Menike", number: "5", departs: "05:55", arrives: "08:55", duration: "3h 00m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Intercity Express", number: "15", departs: "07:00", arrives: "09:30", duration: "2h 30m", class: ["1st", "2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "7", departs: "09:45", arrives: "13:00", duration: "3h 15m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Night Mail", number: "41", departs: "21:00", arrives: "00:05", duration: "3h 05m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Ella: {
      trains: [
        { name: "Podi Menike", number: "5", departs: "05:55", arrives: "14:40", duration: "8h 45m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "7", departs: "09:45", arrives: "18:15", duration: "8h 30m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Hatton: {
      trains: [
        { name: "Podi Menike", number: "5", departs: "05:55", arrives: "10:45", duration: "4h 50m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "7", departs: "09:45", arrives: "14:30", duration: "4h 45m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Nanuoya: {
      trains: [
        { name: "Podi Menike", number: "5", departs: "05:55", arrives: "12:30", duration: "6h 35m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "7", departs: "09:45", arrives: "16:15", duration: "6h 30m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
  },
  Kandy: {
    Colombo: {
      trains: [
        { name: "Intercity Express", number: "16", departs: "06:30", arrives: "09:00", duration: "2h 30m", class: ["1st", "2nd", "3rd"], days: "Daily" },
        { name: "Podi Menike", number: "6", departs: "08:35", arrives: "11:35", duration: "3h 00m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "8", departs: "11:10", arrives: "14:30", duration: "3h 20m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Night Mail", number: "42", departs: "18:00", arrives: "21:05", duration: "3h 05m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Ella: {
      trains: [
        { name: "Podi Menike", number: "5", departs: "09:00", arrives: "14:40", duration: "5h 40m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "7", departs: "11:00", arrives: "16:45", duration: "5h 45m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Hatton: {
      trains: [
        { name: "Podi Menike", number: "5", departs: "09:00", arrives: "10:45", duration: "1h 45m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "7", departs: "11:00", arrives: "12:45", duration: "1h 45m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Nanuoya: {
      trains: [
        { name: "Podi Menike", number: "5", departs: "09:00", arrives: "12:20", duration: "3h 20m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "7", departs: "11:00", arrives: "14:15", duration: "3h 15m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
  },
  Hatton: {
    Colombo: {
      trains: [
        { name: "Podi Menike", number: "6", departs: "06:30", arrives: "11:00", duration: "4h 30m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "8", departs: "09:15", arrives: "14:00", duration: "4h 45m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Kandy: {
      trains: [
        { name: "Podi Menike", number: "6", departs: "06:30", arrives: "08:15", duration: "1h 45m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "8", departs: "09:15", arrives: "11:00", duration: "1h 45m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Ella: {
      trains: [
        { name: "Podi Menike", number: "5", departs: "11:30", arrives: "14:00", duration: "2h 30m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "7", departs: "13:00", arrives: "15:30", duration: "2h 30m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Nanuoya: {
      trains: [
        { name: "Podi Menike", number: "5", departs: "11:30", arrives: "12:55", duration: "1h 25m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "7", departs: "13:00", arrives: "14:20", duration: "1h 20m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
  },
  Nanuoya: {
    Colombo: {
      trains: [
        { name: "Podi Menike", number: "6", departs: "05:00", arrives: "11:35", duration: "6h 35m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "8", departs: "07:00", arrives: "13:30", duration: "6h 30m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Kandy: {
      trains: [
        { name: "Podi Menike", number: "6", departs: "05:00", arrives: "08:20", duration: "3h 20m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "8", departs: "07:00", arrives: "10:15", duration: "3h 15m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Ella: {
      trains: [
        { name: "Podi Menike", number: "5", departs: "13:30", arrives: "15:15", duration: "1h 45m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "7", departs: "15:00", arrives: "16:45", duration: "1h 45m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Hatton: {
      trains: [
        { name: "Podi Menike", number: "6", departs: "05:00", arrives: "06:25", duration: "1h 25m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "8", departs: "07:00", arrives: "08:20", duration: "1h 20m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
  },
  Ella: {
    Colombo: {
      trains: [
        { name: "Podi Menike", number: "6", departs: "06:00", arrives: "14:45", duration: "8h 45m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "8", departs: "08:15", arrives: "16:45", duration: "8h 30m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Kandy: {
      trains: [
        { name: "Podi Menike", number: "6", departs: "06:00", arrives: "11:40", duration: "5h 40m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "8", departs: "08:15", arrives: "14:00", duration: "5h 45m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Hatton: {
      trains: [
        { name: "Podi Menike", number: "6", departs: "06:00", arrives: "08:30", duration: "2h 30m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "8", departs: "08:15", arrives: "10:45", duration: "2h 30m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
    Nanuoya: {
      trains: [
        { name: "Podi Menike", number: "6", departs: "06:00", arrives: "07:45", duration: "1h 45m", class: ["2nd", "3rd"], days: "Daily" },
        { name: "Udarata Menike", number: "8", departs: "08:15", arrives: "10:00", duration: "1h 45m", class: ["2nd", "3rd"], days: "Daily" },
      ]
    },
  }
};

interface TrainOption {
  name: string;
  number: string;
  departs: string;
  arrives: string;
  duration: string;
  class: string[];
  days: string;
}

const TrainBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searched, setSearched] = useState(false);
  const [expandedTrain, setExpandedTrain] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  const availableTrains: TrainOption[] = searched && from && to && from !== to
    ? TRAIN_SCHEDULES[from]?.[to]?.trains || []
    : [];

  const handleSearch = () => {
    if (!from || !to) {
      toast.error("Please select both departure and destination stations");
      return;
    }
    if (from === to) {
      toast.error("Departure and destination cannot be the same");
      return;
    }
    setSearched(true);
    if (!TRAIN_SCHEDULES[from]?.[to]) {
      toast.info("No direct trains found for this route");
    } else {
      toast.success(`Found ${TRAIN_SCHEDULES[from][to].trains.length} train(s)`);
    }
  };

  const handleBook = async (train: TrainOption) => {
    if (!user) {
      toast.error("Please sign in to book a train");
      navigate("/auth");
      return;
    }

    setBookingLoading(train.number);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      await supabase.functions.invoke("send-booking-notification", {
        body: {
          bookingType: "train",
          bookingDetails: {
            trainName: train.name,
            trainNumber: train.number,
            from,
            to,
            departure: train.departs,
            arrival: train.arrives,
            duration: train.duration,
            class: train.class.join(", "),
            days: train.days,
          },
          customerEmail: user.email,
          customerName: profile?.full_name || "Guest",
          totalAmount: 0,
        },
      });

      toast.success(`Train booking request sent! You'll receive a confirmation email shortly.`);
    } catch (error) {
      console.error("Error sending train booking notification:", error);
      toast.error("Failed to process booking. Please try again.");
    } finally {
      setBookingLoading(null);
    }
  };

  const stationInfo: Record<string, { desc: string; icon: string }> = {
    Colombo: { desc: "Main hub — Fort Station", icon: "🏙️" },
    Kandy: { desc: "Cultural capital — Hill Country gateway", icon: "🏔️" },
    Hatton: { desc: "Tea country — Adam's Peak access", icon: "🍵" },
    Nanuoya: { desc: "Nuwara Eliya access — Cool climate", icon: "🌿" },
    Ella: { desc: "Scenic village — Nine Arch Bridge", icon: "🌉" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Train className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Train Booking</h1>
            </div>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore Sri Lanka's iconic hill country railway — one of the most scenic train rides in the world
            </p>
          </div>

          {/* Search Card */}
          <Card className="max-w-2xl mx-auto mb-8 shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Find Your Train
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select value={from} onValueChange={v => { setFrom(v); setSearched(false); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATIONS.map(s => (
                        <SelectItem key={s} value={s} disabled={s === to}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Select value={to} onValueChange={v => { setTo(v); setSearched(false); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATIONS.map(s => (
                        <SelectItem key={s} value={s} disabled={s === from}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {from && to && from !== to && (
                <div className="flex items-center justify-center gap-3 py-2 px-4 bg-muted/50 rounded-lg text-sm">
                  <span className="font-medium">{from}</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span className="font-medium">{to}</span>
                </div>
              )}

              <Button className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90" onClick={handleSearch}>
                <Train className="h-4 w-4 mr-2" />
                Search Trains
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {searched && (
            <div className="max-w-2xl mx-auto">
              {availableTrains.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Train className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No Direct Trains</h3>
                    <p className="text-muted-foreground text-sm">No direct trains found for {from} → {to}. Consider changing your route.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {availableTrains.length} Train{availableTrains.length > 1 ? "s" : ""} Found
                    <span className="text-muted-foreground font-normal text-sm ml-2">{from} → {to}</span>
                  </h2>
                  {availableTrains.map((train, i) => (
                    <Card key={i} className="border border-border/60 hover:shadow-card transition-shadow">
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <Train className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-foreground">{train.name}</span>
                              <Badge variant="outline" className="text-xs">#{train.number}</Badge>
                              <Badge variant="secondary" className="text-xs">{train.days}</Badge>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-foreground">{train.departs}</p>
                                <p className="text-xs text-muted-foreground">{from}</p>
                              </div>
                              <div className="flex-1 flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {train.duration}
                                </div>
                                <div className="w-full h-px bg-border relative">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <ArrowRight className="h-3 w-3 text-primary bg-background" />
                                  </div>
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-foreground">{train.arrives}</p>
                                <p className="text-xs text-muted-foreground">{to}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {train.class.map(c => (
                                <Badge key={c} variant="outline" className="text-xs">{c} Class</Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Expand for info */}
                        <button
                          className="flex items-center gap-1 text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
                          onClick={() => setExpandedTrain(expandedTrain === `${i}` ? null : `${i}`)}
                        >
                          <Info className="h-3 w-3" />
                          {expandedTrain === `${i}` ? "Hide" : "Booking info"}
                          {expandedTrain === `${i}` ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>

                        {expandedTrain === `${i}` && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-1">
                            <p>🎫 Book at any train station counter or via the <a href="https://www.railway.gov.lk" target="_blank" rel="noopener noreferrer" className="text-primary underline">Sri Lanka Railways</a> official portal.</p>
                            <p>💡 Reserved seats recommended for 1st and 2nd class during peak season.</p>
                            <p>📞 Sri Lanka Railways: +94 11 243 5838</p>
                          </div>
                        )}

                        <Button
                          className="w-full mt-4 bg-gradient-tropical text-primary-foreground hover:opacity-90"
                          onClick={() => handleBook(train)}
                          disabled={bookingLoading === train.number}
                        >
                          {bookingLoading === train.number && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Book This Train
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stations Info */}
          <div className="max-w-2xl mx-auto mt-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Available Stations</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {STATIONS.map(station => (
                <Card key={station} className="hover:shadow-card transition-shadow cursor-pointer" onClick={() => !from ? setFrom(station) : !to ? setTo(station) : null}>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xl mb-1">{stationInfo[station]?.icon}</p>
                    <p className="font-semibold text-sm text-foreground">{station}</p>
                    <p className="text-xs text-muted-foreground">{stationInfo[station]?.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainBooking;
