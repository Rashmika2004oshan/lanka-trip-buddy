import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Mail, Globe, Calendar, Car, Hotel, MapPin, Plus,
  Loader2, Pencil, Trash2, Star, Download, Eye, ChevronRight, Clock,
  Users, TrendingUp, DollarSign, UserPlus, ShieldCheck, BarChart3,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, parseISO, isWithinInterval } from "date-fns";
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
import jsPDF from "jspdf";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

interface Profile {
  full_name: string | null;
  bio: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at?: string;
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
  guests: number | null;
  interests: any;
  created_at: string;
  itinerary_data: any;
}

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDriver, isHotelOwner, isAdmin, roles, loading: rolesLoading } = useUserRole();
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

  const [editVehicle, setEditVehicle] = useState<VehicleItem | null>(null);
  const [editHotel, setEditHotel] = useState<HotelItem | null>(null);
  const [viewItinerary, setViewItinerary] = useState<SavedItinerary | null>(null);

  // Admin analytics state
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0, totalBookings: 0, totalVehicles: 0, totalHotels: 0,
    totalRevenue: 0, todayBookings: 0, newUsersThisWeek: 0, pendingRequests: 0,
  });
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && !rolesLoading) fetchAllData();
  }, [user, rolesLoading, isDriver, isHotelOwner, isAdmin]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isTraveller = !isDriver && !isHotelOwner && !isAdmin;

      const promises: any[] = [
        supabase.from("profiles").select("*").eq("id", user.id).single().then(r => r),
      ];

      if (isTraveller) {
        promises.push(
          supabase.from("bookings").select("*, vehicles(vehicle_type, model, vehicle_number), hotels(hotel_name, city, stars)").eq("user_id", user.id).order("created_at", { ascending: false }).then(r => r),
          supabase.from("saved_itineraries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(r => r),
        );
      }

      if (isDriver) {
        promises.push(
          supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(r => r),
        );
      }

      if (isHotelOwner) {
        promises.push(
          supabase.from("hotels").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(r => r),
        );
      }

      // Admin: fetch all analytics data
      if (isAdmin) {
        promises.push(
          supabase.from("profiles").select("*").then(r => r),
          supabase.from("bookings").select("*, vehicles(*), hotels(*)").order("created_at", { ascending: false }).then(r => r),
          supabase.from("vehicles").select("*").then(r => r),
          supabase.from("hotels").select("*").then(r => r),
          supabase.from("role_requests").select("*").then(r => r),
          supabase.from("user_roles").select("*").then(r => r),
        );
      }

      const results = await Promise.all(promises);

      if (results[0].data) {
        setProfile(results[0].data);
        setProfileForm(results[0].data);
      }

      if (isTraveller) {
        setBookings(results[1]?.data || []);
        setItineraries(results[2]?.data || []);
      }
      if (isDriver) {
        setMyVehicles(results[1]?.data || []);
      }
      if (isHotelOwner) {
        setMyHotels(results[1]?.data || []);
      }

      // Admin analytics processing
      if (isAdmin) {
        const allProfiles = results[1]?.data || [];
        const bookingsData = results[2]?.data || [];
        const vehiclesData = results[3]?.data || [];
        const hotelsData = results[4]?.data || [];
        const requestsData = results[5]?.data || [];
        const rolesData = results[6]?.data || [];

        const today = new Date();
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);
        const weekAgo = subDays(today, 7);

        const todayBookings = bookingsData.filter((b: any) => {
          const d = parseISO(b.created_at);
          return isWithinInterval(d, { start: todayStart, end: todayEnd });
        });
        const newUsersThisWeek = allProfiles.filter((p: any) => parseISO(p.created_at) >= weekAgo);
        const totalRevenue = bookingsData.reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0);

        setAllBookings(bookingsData);
        setAllUsers(allProfiles.map((p: any) => ({
          ...p,
          roles: rolesData.filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
        })));

        setAdminStats({
          totalUsers: allProfiles.length,
          totalBookings: bookingsData.length,
          totalVehicles: vehiclesData.length,
          totalHotels: hotelsData.length,
          totalRevenue,
          todayBookings: todayBookings.length,
          newUsersThisWeek: newUsersThisWeek.length,
          pendingRequests: requestsData.filter((r: any) => r.status === 'pending').length,
        });
      }
    } catch (err) {
      console.error("Error loading profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Admin chart data
  const bookingsByDay = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'MMM dd'));
    return last7.map(day => ({
      day,
      bookings: allBookings.filter(b => format(parseISO(b.created_at), 'MMM dd') === day).length,
      revenue: allBookings.filter(b => format(parseISO(b.created_at), 'MMM dd') === day).reduce((s, b) => s + Number(b.total_amount || 0), 0),
    }));
  }, [allBookings]);

  const revenueByType = useMemo(() => [
    { name: 'Vehicle Rentals', value: allBookings.filter(b => b.booking_type === 'vehicle').reduce((s, b) => s + Number(b.total_amount || 0), 0) },
    { name: 'Accommodations', value: allBookings.filter(b => b.booking_type === 'accommodation').reduce((s, b) => s + Number(b.total_amount || 0), 0) },
  ], [allBookings]);

  const usersByRole = useMemo(() => {
    const counts: Record<string, number> = { user: 0, driver: 0, hotel_owner: 0, admin: 0 };
    allUsers.forEach((u: any) => {
      if (!u.roles || u.roles.length === 0) counts.user++;
      else u.roles.forEach((r: string) => { counts[r] = (counts[r] || 0) + 1; });
    });
    return [
      { name: 'Travellers', value: counts.user, fill: CHART_COLORS[0] },
      { name: 'Drivers', value: counts.driver, fill: CHART_COLORS[1] },
      { name: 'Hotel Owners', value: counts.hotel_owner, fill: CHART_COLORS[2] },
      { name: 'Admins', value: counts.admin, fill: CHART_COLORS[3] },
    ];
  }, [allUsers]);

  const registrationsByDay = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'MMM dd'));
    return last7.map(day => ({
      day,
      registrations: allUsers.filter((u: any) => format(parseISO(u.created_at), 'MMM dd') === day).length,
    }));
  }, [allUsers]);

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
      setProfile(prev => ({ ...prev, ...profileForm }));
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

  const downloadItineraryPdf = (it: SavedItinerary) => {
    const doc = new jsPDF();
    const data = it.itinerary_data;
    let y = 20;
    doc.setFontSize(18);
    doc.text(it.title, 20, y); y += 10;
    doc.setFontSize(10);
    doc.text(`${it.days} Days · ${it.guests || 1} Guest(s) · Created: ${format(new Date(it.created_at), "MMM dd, yyyy")}`, 20, y); y += 8;
    if (it.interests) {
      const interests = Array.isArray(it.interests) ? it.interests.join(", ") : String(it.interests);
      doc.text(`Interests: ${interests}`, 20, y); y += 8;
    }
    doc.text(`Traveller: ${profile.full_name || user?.email || "N/A"}`, 20, y); y += 12;
    doc.setFontSize(12);
    doc.text("Daily Itinerary", 20, y); y += 8;
    if (data?.days && Array.isArray(data.days)) {
      data.days.forEach((day: any, i: number) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.text(`Day ${i + 1}: ${day.destination || ""}`, 20, y); y += 6;
        doc.setFontSize(9);
        if (day.description) { doc.text(day.description.substring(0, 90), 24, y); y += 5; }
        if (day.hotel) { doc.text(`Hotel: ${day.hotel}`, 24, y); y += 5; }
        if (day.hotelCost) { doc.text(`Accommodation: USD ${Number(day.hotelCost).toFixed(2)}`, 24, y); y += 5; }
        y += 4;
      });
    }
    if (data?.totalCost) {
      if (y > 260) { doc.addPage(); y = 20; }
      y += 4;
      doc.setFontSize(12);
      doc.text(`Total Estimated Cost: USD ${Number(data.totalCost).toFixed(2)}`, 20, y);
    }
    doc.save(`${it.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
  };

  const getRoleLabel = () => {
    if (isAdmin) return "Admin";
    if (isDriver) return "Vehicle Owner";
    if (isHotelOwner) return "Hotel Owner";
    return "Traveller";
  };

  const getRoleBadgeStyle = () => {
    if (isAdmin) return "bg-destructive/10 text-destructive border-destructive/20";
    if (isDriver) return "bg-primary/10 text-primary border-primary/20";
    if (isHotelOwner) return "bg-secondary/10 text-secondary border-secondary/20";
    return "bg-muted text-muted-foreground border-border";
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

  const isTraveller = !isDriver && !isHotelOwner && !isAdmin;
  const defaultTab = isAdmin ? "analytics" : isDriver ? "vehicles" : isHotelOwner ? "hotels" : "bookings";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">

          {/* ===== PROFILE CARD ===== */}
          <Card className="mb-8 overflow-hidden border-border/50">
            <div className="h-28 bg-gradient-tropical" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center shadow-elevated overflow-hidden shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground truncate">
                      {profile.full_name || user?.email?.split("@")[0] || "User"}
                    </h1>
                    <Badge className={getRoleBadgeStyle()}>{getRoleLabel()}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} className="gap-1.5 shrink-0">
                  <Pencil className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Country</p>
                    <p className="text-sm font-medium text-foreground">{profile.country || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium text-foreground">{getRoleLabel()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium text-foreground">
                      {profile.created_at ? format(new Date(profile.created_at), "MMM dd, yyyy") : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {profile.bio && (
                <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>
              )}
            </CardContent>
          </Card>

          {/* ===== TABS ===== */}
          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6 flex-wrap">
              {/* Admin tab */}
              {isAdmin && (
                <>
                  <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3">
                    <BarChart3 className="h-4 w-4 mr-1.5" /> Analytics
                  </TabsTrigger>
                  <TabsTrigger value="admin-manage" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3">
                    <ShieldCheck className="h-4 w-4 mr-1.5" /> Manage
                  </TabsTrigger>
                </>
              )}
              {/* Traveller tabs */}
              {isTraveller && (
                <>
                  <TabsTrigger value="bookings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3">
                    My Bookings
                  </TabsTrigger>
                  <TabsTrigger value="itineraries" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-3">
                    Saved Itineraries
                  </TabsTrigger>
                </>
              )}
              {/* Driver tabs */}
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
              {/* Hotel Owner tabs */}
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

            {/* === ADMIN: Analytics === */}
            {isAdmin && (
              <TabsContent value="analytics">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{adminStats.totalUsers}</p>
                          <p className="text-xs text-muted-foreground">Total Users</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{adminStats.totalBookings}</p>
                          <p className="text-xs text-muted-foreground">Total Bookings</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Car className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{adminStats.totalVehicles}</p>
                          <p className="text-xs text-muted-foreground">Vehicles Listed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Hotel className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{adminStats.totalHotels}</p>
                          <p className="text-xs text-muted-foreground">Hotels Listed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-foreground">${(adminStats.totalRevenue / 1000).toFixed(1)}K</p>
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{adminStats.todayBookings}</p>
                          <p className="text-xs text-muted-foreground">Today's Bookings</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-pink-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{adminStats.newUsersThisWeek}</p>
                          <p className="text-xs text-muted-foreground">New This Week</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{adminStats.pendingRequests}</p>
                          <p className="text-xs text-muted-foreground">Pending Requests</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-5 w-5" /> Bookings & Revenue (Last 7 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={bookingsByDay}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="day" className="text-xs" />
                          <YAxis yAxisId="left" className="text-xs" />
                          <YAxis yAxisId="right" orientation="right" className="text-xs" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Area yAxisId="left" type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Bookings" />
                          <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} name="Revenue (USD)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <DollarSign className="h-5 w-5" /> Revenue by Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={revenueByType} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                            {revenueByType.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`USD ${value.toLocaleString()}`, 'Revenue']}
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-5 w-5" /> Users by Role
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={usersByRole}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Bar dataKey="value" name="Count">
                            {usersByRole.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <UserPlus className="h-5 w-5" /> New Registrations (Last 7 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={registrationsByDay}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="day" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Bar dataKey="registrations" fill="hsl(var(--primary))" name="Registrations" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* === ADMIN: Manage (link to full admin dashboard) === */}
            {isAdmin && (
              <TabsContent value="admin-manage">
                <div className="text-center py-12">
                  <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Admin Management</h3>
                  <p className="text-sm text-muted-foreground mb-6">Access the full admin dashboard to manage users, role requests, bookings, vehicles, and hotels.</p>
                  <Button onClick={() => navigate("/admin")} className="gap-2">
                    <ShieldCheck className="h-4 w-4" /> Open Admin Dashboard
                  </Button>
                </div>
              </TabsContent>
            )}

            {/* === TRAVELLER: Bookings === */}
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
                              {b.booking_type === "vehicle" ? b.vehicles?.model : b.hotels?.hotel_name}
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

            {/* === TRAVELLER: Itineraries === */}
            <TabsContent value="itineraries">
              {itineraries.length === 0 ? (
                <EmptyState icon={MapPin} title="No saved itineraries" description="Plan a trip and save it to see it here" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {itineraries.map(it => (
                    <Card key={it.id} className="border-border/50 hover:shadow-card transition-shadow cursor-pointer group" onClick={() => setViewItinerary(it)}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-foreground mb-1">{it.title}</h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-xs text-muted-foreground">{it.days} days · {it.guests || 1} guest(s)</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(it.created_at), "MMM dd, yyyy")}</p>
                        {it.itinerary_data?.totalCost && (
                          <p className="mt-2 text-sm font-bold text-primary">USD {Number(it.itinerary_data.totalCost).toFixed(2)}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); setViewItinerary(it); }}>
                            <Eye className="h-3 w-3" /> View
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); downloadItineraryPdf(it); }}>
                            <Download className="h-3 w-3" /> PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* === DRIVER: Vehicles === */}
            <TabsContent value="vehicles">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Listed Vehicles</h2>
                <Button onClick={() => navigate("/driver-survey")} className="gap-2">
                  <Plus className="h-4 w-4" /> List Your Vehicle
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

            {/* === HOTEL OWNER: Hotels === */}
            <TabsContent value="hotels">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Listed Hotels</h2>
                <Button onClick={() => navigate("/hotel-survey")} className="gap-2">
                  <Plus className="h-4 w-4" /> List Your Hotel
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

      {/* View Itinerary Detail Dialog */}
      <Dialog open={!!viewItinerary} onOpenChange={() => setViewItinerary(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewItinerary?.title}</DialogTitle>
          </DialogHeader>
          {viewItinerary && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{viewItinerary.days} Days</span>
                <span>·</span>
                <span>{viewItinerary.guests || 1} Guest(s)</span>
                <span>·</span>
                <span>{format(new Date(viewItinerary.created_at), "MMM dd, yyyy")}</span>
              </div>
              {viewItinerary.interests && (
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(viewItinerary.interests) ? viewItinerary.interests : []).map((int: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{int}</Badge>
                  ))}
                </div>
              )}
              {/* Support both old format (plan) and new format (days) */}
              {(viewItinerary.itinerary_data?.days || viewItinerary.itinerary_data?.plan) && (
                <div className="space-y-3">
                  {(viewItinerary.itinerary_data.days || viewItinerary.itinerary_data.plan || []).map((day: any, i: number) => (
                    <Card key={i} className="border-border/50">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm text-foreground">Day {i + 1}: {day.destination || day.city || day.activity || ""}</h4>
                        {(day.description || day.activity) && <p className="text-xs text-muted-foreground mt-1">{day.description || day.activity}</p>}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          {day.hotel && <span>🏨 {day.hotel}</span>}
                          {(day.hotelCost || day.hotelCost === 0) && <span>USD {Number(day.hotelCost).toFixed(2)}/night</span>}
                          {(day.city || day.hotelCity || day.destinationCity) && <span>📍 {day.city || day.hotelCity || day.destinationCity}</span>}
                          {day.transport && <span>🚗 {day.transport}</span>}
                          {day.dailyTotal && <span>💵 USD {Number(day.dailyTotal).toFixed(2)}/day</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {viewItinerary.itinerary_data?.vehicle && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Vehicle: </span>
                  {typeof viewItinerary.itinerary_data.vehicle === 'string' 
                    ? viewItinerary.itinerary_data.vehicle 
                    : `${viewItinerary.itinerary_data.vehicle.model || ''} (${viewItinerary.itinerary_data.vehicle.vehicle_type || ''})`}
                </div>
              )}
              {viewItinerary.itinerary_data?.totalCost && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-lg font-bold text-primary">Total: USD {Number(viewItinerary.itinerary_data.totalCost).toFixed(2)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItinerary(null)}>Close</Button>
            <Button onClick={() => viewItinerary && downloadItineraryPdf(viewItinerary)} className="gap-1.5">
              <Download className="h-4 w-4" /> Download PDF
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
    const fetchBookings = async () => {
      try {
        if (type === "vehicle") {
          const { data: vehicles } = await supabase.from("vehicles").select("id").eq("user_id", userId);
          if (vehicles && vehicles.length > 0) {
            const vehicleIds = vehicles.map(v => v.id);
            const { data } = await supabase
              .from("bookings")
              .select("*, vehicles(vehicle_type, model, vehicle_number)")
              .in("vehicle_id", vehicleIds)
              .order("created_at", { ascending: false });
            setBookings(data || []);
          }
        } else {
          const { data: hotels } = await supabase.from("hotels").select("id").eq("user_id", userId);
          if (hotels && hotels.length > 0) {
            const hotelIds = hotels.map(h => h.id);
            const { data } = await supabase
              .from("bookings")
              .select("*, hotels(hotel_name, city, stars)")
              .in("hotel_id", hotelIds)
              .order("created_at", { ascending: false });
            setBookings(data || []);
          }
        }
      } catch (err) {
        console.error("Error fetching owner bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [userId, type]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return <EmptyState icon={Calendar} title={type === "vehicle" ? "No client bookings yet" : "No reservations yet"} description="Bookings from clients will appear here" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {bookings.map(b => (
        <Card key={b.id} className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {type === "vehicle" ? <Car className="h-4 w-4 text-primary" /> : <Hotel className="h-4 w-4 text-primary" />}
                <span className="font-semibold text-sm">
                  {type === "vehicle" ? b.vehicles?.model : b.hotels?.hotel_name}
                </span>
              </div>
              <Badge variant={b.booking_status === "confirmed" ? "default" : "secondary"} className="text-xs">
                {b.booking_status}
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {type === "vehicle" && b.rental_start_date && (
                <p>{format(new Date(b.rental_start_date), "MMM dd")} → {format(new Date(b.rental_end_date), "MMM dd, yyyy")} · {b.estimated_km}km</p>
              )}
              {type === "hotel" && b.check_in_date && (
                <p>{format(new Date(b.check_in_date), "MMM dd")} → {format(new Date(b.check_out_date), "MMM dd, yyyy")} · {b.number_of_nights} night(s)</p>
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
  );
};

export default UserProfile;
