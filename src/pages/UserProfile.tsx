import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Mail, Globe, Calendar, Car, Hotel, MapPin, Plus,
  Loader2, Pencil, Trash2, Star, CreditCard, Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Profile {
  full_name: string | null;
  bio: string | null;
  country: string | null;
  avatar_url: string | null;
}

interface Booking {
  id: string;
  booking_type: string;
  subtotal: number;
  service_charge: number;
  total_amount: number;
  booking_status: string;
  created_at: string;
  rental_start_date?: string;
  rental_end_date?: string;
  estimated_km?: number;
  check_in_date?: string;
  check_out_date?: string;
  number_of_persons?: number;
  number_of_nights?: number;
  room_type?: string;
  vehicles?: { vehicle_type: string; model: string; vehicle_number: string };
  hotels?: { hotel_name: string; city: string; stars: number };
}

interface VehicleItem {
  id: string;
  vehicle_type: string;
  model: string;
  vehicle_number: string;
  per_km_charge: number;
  vehicle_category: string | null;
  image_url: string | null;
}

interface HotelItem {
  id: string;
  hotel_name: string;
  stars: number;
  per_night_charge: number;
  category: string;
  city: string;
  image_url: string | null;
}

interface SavedItinerary {
  id: string;
  title: string;
  days: number;
  created_at: string;
  itinerary_data: any;
}

const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDriver, isHotelOwner, roles, loading: rolesLoading } = useUserRole();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile>({ full_name: null, bio: null, country: null, avatar_url: null });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Profile>({ full_name: null, bio: null, country: null, avatar_url: null });
  const [saving, setSaving] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [myVehicles, setMyVehicles] = useState<VehicleItem[]>([]);
  const [myHotels, setMyHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialogs for vehicles/hotels
  const [editVehicle, setEditVehicle] = useState<VehicleItem | null>(null);
  const [editHotel, setEditHotel] = useState<HotelItem | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user, isDriver, isHotelOwner]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const promises: any[] = [
        supabase.from("profiles").select("*").eq("id", user.id).single().then(r => r),
        supabase.from("bookings").select("*, vehicles(vehicle_type, model, vehicle_number), hotels(hotel_name, city, stars)").eq("user_id", user.id).order("created_at", { ascending: false }).then(r => r),
        supabase.from("saved_itineraries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(r => r),
      ];

      if (isDriver) {
        promises.push(supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(r => r));
      }
      if (isHotelOwner) {
        promises.push(supabase.from("hotels").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(r => r));
      }

      const results = await Promise.all(promises);
      
      if (results[0].data) {
        setProfile(results[0].data);
        setProfileForm(results[0].data);
      }
      setBookings(results[1].data || []);
      setItineraries(results[2].data || []);

      let idx = 3;
      if (isDriver && results[idx]) {
        setMyVehicles(results[idx].data || []);
        idx++;
      }
      if (isHotelOwner && results[idx]) {
        setMyHotels(results[idx].data || []);
      }
    } catch (err) {
      console.error("Error loading profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: profileForm.full_name,
        bio: profileForm.bio,
        country: profileForm.country,
      }).eq("id", user.id);
      if (error) throw error;
      setProfile(profileForm);
      setEditingProfile(false);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Vehicle removed");
    setMyVehicles(prev => prev.filter(v => v.id !== id));
  };

  const deleteHotel = async (id: string) => {
    const { error } = await supabase.from("hotels").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Hotel removed");
    setMyHotels(prev => prev.filter(h => h.id !== id));
  };

  const updateVehicle = async () => {
    if (!editVehicle) return;
    setSaving(true);
    const { error } = await supabase.from("vehicles").update({
      model: editVehicle.model,
      vehicle_number: editVehicle.vehicle_number,
      per_km_charge: editVehicle.per_km_charge,
      vehicle_category: editVehicle.vehicle_category,
      vehicle_type: editVehicle.vehicle_type,
    }).eq("id", editVehicle.id);
    setSaving(false);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Vehicle updated");
    setMyVehicles(prev => prev.map(v => v.id === editVehicle.id ? editVehicle : v));
    setEditVehicle(null);
  };

  const updateHotel = async () => {
    if (!editHotel) return;
    setSaving(true);
    const { error } = await supabase.from("hotels").update({
      hotel_name: editHotel.hotel_name,
      stars: editHotel.stars,
      per_night_charge: editHotel.per_night_charge,
      category: editHotel.category,
      city: editHotel.city,
    }).eq("id", editHotel.id);
    setSaving(false);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Hotel updated");
    setMyHotels(prev => prev.map(h => h.id === editHotel.id ? editHotel : h));
    setEditHotel(null);
  };

  const getRoleBadge = () => {
    if (isDriver) return <Badge className="bg-primary/10 text-primary border-primary/20">Driver</Badge>;
    if (isHotelOwner) return <Badge className="bg-secondary/10 text-secondary border-secondary/20">Hotel Owner</Badge>;
    return <Badge variant="outline">Traveller</Badge>;
  };

  if (authLoading || rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const defaultTab = isDriver ? "vehicles" : isHotelOwner ? "hotels" : "bookings";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Profile Header */}
          <div className="relative mb-8">
            <div className="h-32 rounded-2xl bg-gradient-tropical" />
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 px-6">
              <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center shadow-elevated overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">
                    {profile.full_name || user?.email?.split("@")[0] || "User"}
                  </h1>
                  {getRoleBadge()}
                </div>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5" /> {user?.email}
                  {profile.country && <><Globe className="h-3.5 w-3.5 ml-3" /> {profile.country}</>}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </div>
            {profile.bio && (
              <p className="mt-4 px-6 text-sm text-muted-foreground max-w-2xl">{profile.bio}</p>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6">
              {!isDriver && !isHotelOwner && (
                <>
                  <TabsTrigger value="bookings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3">
                    Bookings
                  </TabsTrigger>
                  <TabsTrigger value="itineraries" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3">
                    Itineraries
                  </TabsTrigger>
                </>
              )}
              {isDriver && (
                <>
                  <TabsTrigger value="vehicles" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3">
                    My Vehicles
                  </TabsTrigger>
                  <TabsTrigger value="driver-bookings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3">
                    Client Bookings
                  </TabsTrigger>
                </>
              )}
              {isHotelOwner && (
                <>
                  <TabsTrigger value="hotels" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3">
                    My Hotels
                  </TabsTrigger>
                  <TabsTrigger value="hotel-bookings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3">
                    Reservations
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Traveller Bookings */}
            <TabsContent value="bookings">
              {bookings.length === 0 ? (
                <EmptyState icon={Calendar} title="No bookings yet" description="Your travel bookings will appear here" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {bookings.map(b => (
                    <Card key={b.id} className="border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {b.booking_type === "vehicle" ? <Car className="h-4 w-4 text-primary" /> : <Hotel className="h-4 w-4 text-primary" />}
                            <span className="font-semibold text-sm">
                              {b.booking_type === "vehicle" ? `${b.vehicles?.model}` : b.hotels?.hotel_name}
                            </span>
                          </div>
                          <Badge variant={b.booking_status === "confirmed" ? "default" : "secondary"} className="text-xs">
                            {b.booking_status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {b.booking_type === "vehicle" && b.rental_start_date && (
                            <p>{format(new Date(b.rental_start_date), "MMM dd")} → {format(new Date(b.rental_end_date!), "MMM dd, yyyy")} · {b.estimated_km}km</p>
                          )}
                          {b.booking_type === "accommodation" && b.check_in_date && (
                            <p>{format(new Date(b.check_in_date), "MMM dd")} → {format(new Date(b.check_out_date!), "MMM dd, yyyy")} · {b.number_of_nights} night(s)</p>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">{format(new Date(b.created_at), "MMM dd, yyyy")}</span>
                          <span className="font-bold text-primary">USD {Number(b.total_amount).toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Traveller Itineraries */}
            <TabsContent value="itineraries">
              {itineraries.length === 0 ? (
                <EmptyState icon={MapPin} title="No saved itineraries" description="Plan a trip and save it to see it here" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {itineraries.map(it => (
                    <Card key={it.id} className="border-border/50 hover:shadow-card transition-shadow">
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-foreground mb-1">{it.title}</h3>
                        <p className="text-xs text-muted-foreground">{it.days} days · {format(new Date(it.created_at), "MMM dd, yyyy")}</p>
                        {it.itinerary_data?.totalCost && (
                          <p className="mt-2 text-sm font-bold text-primary">USD {Number(it.itinerary_data.totalCost).toFixed(2)}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Driver Vehicles */}
            <TabsContent value="vehicles">
              <div className="flex justify-end mb-4">
                <Button onClick={() => navigate("/driver-survey")} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Vehicle
                </Button>
              </div>
              {myVehicles.length === 0 ? (
                <EmptyState icon={Car} title="No vehicles listed" description="List your first vehicle to start earning" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myVehicles.map(v => (
                    <Card key={v.id} className="overflow-hidden border-border/50">
                      {v.image_url ? (
                        <img src={v.image_url} alt={v.model} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 bg-muted flex items-center justify-center"><Car className="h-10 w-10 text-muted-foreground" /></div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{v.model}</h3>
                        <p className="text-xs text-muted-foreground">{v.vehicle_type} · {v.vehicle_category} · {v.vehicle_number}</p>
                        <p className="text-primary font-bold mt-1">USD {v.per_km_charge}/km</p>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => setEditVehicle(v)} className="flex-1 gap-1">
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-1">
                                <Trash2 className="h-3 w-3" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                                <AlertDialogDescription>Remove {v.model} from your listings?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteVehicle(v.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Hotel Owner Hotels */}
            <TabsContent value="hotels">
              <div className="flex justify-end mb-4">
                <Button onClick={() => navigate("/hotel-survey")} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Hotel
                </Button>
              </div>
              {myHotels.length === 0 ? (
                <EmptyState icon={Hotel} title="No hotels listed" description="List your first hotel to attract guests" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myHotels.map(h => (
                    <Card key={h.id} className="overflow-hidden border-border/50">
                      {h.image_url ? (
                        <img src={h.image_url} alt={h.hotel_name} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 bg-muted flex items-center justify-center"><Hotel className="h-10 w-10 text-muted-foreground" /></div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold">{h.hotel_name}</h3>
                          <Badge variant="outline" className="text-xs">{h.category}</Badge>
                        </div>
                        <div className="flex items-center gap-0.5 my-1">
                          {Array.from({ length: h.stars }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-secondary text-secondary" />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{h.city}</p>
                        <p className="text-primary font-bold mt-1">USD {h.per_night_charge}/night</p>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => setEditHotel(h)} className="flex-1 gap-1">
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-1">
                                <Trash2 className="h-3 w-3" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Hotel</AlertDialogTitle>
                                <AlertDialogDescription>Remove {h.hotel_name} from your listings?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteHotel(h.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Driver client bookings */}
            <TabsContent value="driver-bookings">
              <OwnerBookings type="vehicle" userId={user?.id} />
            </TabsContent>

            {/* Hotel owner reservations */}
            <TabsContent value="hotel-bookings">
              <OwnerBookings type="hotel" userId={user?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={profileForm.full_name || ""} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input value={profileForm.country || ""} onChange={e => setProfileForm({ ...profileForm, country: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea value={profileForm.bio || ""} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProfile(false)}>Cancel</Button>
            <Button onClick={saveProfile} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={!!editVehicle} onOpenChange={() => setEditVehicle(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Vehicle</DialogTitle></DialogHeader>
          {editVehicle && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input value={editVehicle.model} onChange={e => setEditVehicle({ ...editVehicle, model: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle Number</Label>
                <Input value={editVehicle.vehicle_number} onChange={e => setEditVehicle({ ...editVehicle, vehicle_number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={editVehicle.vehicle_type} onValueChange={v => setEditVehicle({ ...editVehicle, vehicle_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Bus">Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={editVehicle.vehicle_category || "Mid"} onValueChange={v => setEditVehicle({ ...editVehicle, vehicle_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mid">Mid</SelectItem>
                    <SelectItem value="Luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Per KM Charge (USD)</Label>
                <Input type="number" step="0.01" value={editVehicle.per_km_charge} onChange={e => setEditVehicle({ ...editVehicle, per_km_charge: Number(e.target.value) })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVehicle(null)}>Cancel</Button>
            <Button onClick={updateVehicle} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Hotel Dialog */}
      <Dialog open={!!editHotel} onOpenChange={() => setEditHotel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Hotel</DialogTitle></DialogHeader>
          {editHotel && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Hotel Name</Label>
                <Input value={editHotel.hotel_name} onChange={e => setEditHotel({ ...editHotel, hotel_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={editHotel.city} onChange={e => setEditHotel({ ...editHotel, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Stars</Label>
                <Input type="number" min="1" max="5" value={editHotel.stars} onChange={e => setEditHotel({ ...editHotel, stars: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={editHotel.category} onValueChange={v => setEditHotel({ ...editHotel, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Luxury">Luxury</SelectItem>
                    <SelectItem value="Middle">Middle</SelectItem>
                    <SelectItem value="Low">Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Per Night Charge (USD)</Label>
                <Input type="number" step="0.01" value={editHotel.per_night_charge} onChange={e => setEditHotel({ ...editHotel, per_night_charge: Number(e.target.value) })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditHotel(null)}>Cancel</Button>
            <Button onClick={updateHotel} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Empty state helper
const EmptyState = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

// Owner bookings sub-component
const OwnerBookings = ({ type, userId }: { type: "vehicle" | "hotel"; userId?: string }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      try {
        if (type === "vehicle") {
          const { data: vehicles } = await supabase.from("vehicles").select("id").eq("user_id", userId);
          if (vehicles && vehicles.length > 0) {
            const ids = vehicles.map(v => v.id);
            const { data } = await supabase.from("bookings").select("*, profiles(full_name), vehicles(model, vehicle_number)").in("vehicle_id", ids).order("created_at", { ascending: false });
            setBookings(data || []);
          }
        } else {
          const { data: hotels } = await supabase.from("hotels").select("id").eq("user_id", userId);
          if (hotels && hotels.length > 0) {
            const ids = hotels.map(h => h.id);
            const { data } = await supabase.from("bookings").select("*, profiles(full_name), hotels(hotel_name, city)").in("hotel_id", ids).order("created_at", { ascending: false });
            setBookings(data || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId, type]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (bookings.length === 0) return <EmptyState icon={Calendar} title="No client bookings yet" description="When clients book your properties, they'll appear here" />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {bookings.map((b: any) => (
        <Card key={b.id} className="border-border/50">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-sm">{b.profiles?.full_name || "Guest"}</p>
                <p className="text-xs text-muted-foreground">
                  {type === "vehicle" ? `${b.vehicles?.model} · ${b.vehicles?.vehicle_number}` : `${b.hotels?.hotel_name} · ${b.hotels?.city}`}
                </p>
              </div>
              <Badge variant={b.booking_status === "confirmed" ? "default" : "secondary"} className="text-xs">{b.booking_status}</Badge>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border/50 mt-2">
              <span className="text-xs text-muted-foreground">{format(new Date(b.created_at), "MMM dd, yyyy")}</span>
              <span className="font-bold text-primary text-sm">USD {Number(b.total_amount).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserProfile;
