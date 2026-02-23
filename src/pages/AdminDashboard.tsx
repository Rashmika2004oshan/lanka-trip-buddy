import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Car, Hotel, Calendar, Clock, CheckCircle, XCircle, 
  Loader2, ShieldCheck, TrendingUp, DollarSign, UserPlus
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, parseISO, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string | null; };
}

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  full_name: string | null;
}

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalVehicles: 0,
    totalHotels: 0,
    pendingRequests: 0,
    totalRevenue: 0,
    todayBookings: 0,
    newUsersThisWeek: 0,
  });
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
        toast.error("Access denied. Admin privileges required.");
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      const [
        profilesRes,
        bookingsRes,
        vehiclesRes,
        hotelsRes,
        requestsRes,
        rolesRes
      ] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("bookings").select(`*, vehicles(*), hotels(*)`).order("created_at", { ascending: false }),
        supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
        supabase.from("hotels").select("*").order("created_at", { ascending: false }),
        supabase.from("role_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);

      const profiles = profilesRes.data || [];
      const bookingsData = bookingsRes.data || [];
      const vehiclesData = vehiclesRes.data || [];
      const hotelsData = hotelsRes.data || [];
      const requests = requestsRes.data || [];
      const allRoles = rolesRes.data || [];

      // Map users with their roles
      const usersWithRoles: UserWithRole[] = profiles.map(p => ({
        id: p.id,
        email: "",
        created_at: p.created_at,
        full_name: p.full_name,
        roles: allRoles.filter(r => r.user_id === p.id).map(r => r.role),
      }));

      // Calculate stats
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const weekAgo = subDays(today, 7);

      const todayBookings = bookingsData.filter(b => {
        const bookingDate = parseISO(b.created_at);
        return isWithinInterval(bookingDate, { start: todayStart, end: todayEnd });
      });

      const newUsersThisWeek = profiles.filter(p => {
        const createdAt = parseISO(p.created_at);
        return createdAt >= weekAgo;
      });

      const totalRevenue = bookingsData.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

      setUsers(usersWithRoles);
      setBookings(bookingsData);
      setVehicles(vehiclesData);
      setHotels(hotelsData);
      setRoleRequests(requests);
      
      setStats({
        totalUsers: profiles.length,
        totalBookings: bookingsData.length,
        totalVehicles: vehiclesData.length,
        totalHotels: hotelsData.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        totalRevenue,
        todayBookings: todayBookings.length,
        newUsersThisWeek: newUsersThisWeek.length,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Chart data calculations
  const bookingsByDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'MMM dd');
    });

    return last7Days.map(day => {
      const count = bookings.filter(b => format(parseISO(b.created_at), 'MMM dd') === day).length;
      const revenue = bookings
        .filter(b => format(parseISO(b.created_at), 'MMM dd') === day)
        .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      return { day, bookings: count, revenue };
    });
  }, [bookings]);

  const revenueByType = useMemo(() => {
    const vehicleRevenue = bookings
      .filter(b => b.booking_type === 'vehicle')
      .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const hotelRevenue = bookings
      .filter(b => b.booking_type === 'accommodation')
      .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    
    return [
      { name: 'Vehicle Rentals', value: vehicleRevenue },
      { name: 'Accommodations', value: hotelRevenue },
    ];
  }, [bookings]);

  const usersByRole = useMemo(() => {
    const roleCounts: Record<string, number> = { user: 0, driver: 0, hotel_owner: 0, admin: 0 };
    users.forEach(u => {
      if (u.roles.length === 0) {
        roleCounts.user++;
      } else {
        u.roles.forEach(role => {
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
      }
    });
    return [
      { name: 'Users', value: roleCounts.user, fill: CHART_COLORS[0] },
      { name: 'Drivers', value: roleCounts.driver, fill: CHART_COLORS[1] },
      { name: 'Hotel Owners', value: roleCounts.hotel_owner, fill: CHART_COLORS[2] },
      { name: 'Admins', value: roleCounts.admin, fill: CHART_COLORS[3] },
    ];
  }, [users]);

  const registrationsByDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'MMM dd');
    });

    return last7Days.map(day => {
      const count = users.filter(u => format(parseISO(u.created_at), 'MMM dd') === day).length;
      return { day, registrations: count };
    });
  }, [users]);

  const handleRoleRequest = async (requestId: string, userId: string, role: string, action: 'approved' | 'rejected') => {
    try {
      const { error: updateError } = await supabase
        .from("role_requests")
        .update({ status: action })
        .eq("id", requestId);

      if (updateError) throw updateError;

      if (action === 'approved') {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: role as any });

        if (roleError && !roleError.message.includes('duplicate')) {
          throw roleError;
        }
      }

      toast.success(`Role request ${action}`);
      fetchAllData();
    } catch (error: any) {
      console.error("Error handling role request:", error);
      toast.error(error.message || "Failed to process request");
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage users, bookings, and view analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Car className="h-6 w-6 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalVehicles}</p>
                  <p className="text-xs text-muted-foreground">Vehicles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Hotel className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalHotels}</p>
                  <p className="text-xs text-muted-foreground">Hotels</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-emerald-500" />
                <div>
                  <p className="text-xl font-bold">{(stats.totalRevenue / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.todayBookings}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <UserPlus className="h-6 w-6 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.newUsersThisWeek}</p>
                  <p className="text-xs text-muted-foreground">New Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="requests">Role Requests</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Bookings & Revenue Chart */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Bookings & Revenue (Last 7 Days)
                  </CardTitle>
                  <CardDescription>Daily bookings count and revenue trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={bookingsByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="bookings" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3}
                        name="Bookings"
                      />
                      <Area 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--chart-2))" 
                        fill="hsl(var(--chart-2))" 
                        fillOpacity={0.3}
                        name="Revenue (USD)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue by Type
                  </CardTitle>
                  <CardDescription>Vehicle rentals vs accommodations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={revenueByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {revenueByType.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`USD ${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Users by Role */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users by Role
                  </CardTitle>
                  <CardDescription>Distribution of user roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={usersByRole} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" name="Users" radius={[0, 4, 4, 0]}>
                        {usersByRole.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* New Registrations */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    New Registrations (Last 7 Days)
                  </CardTitle>
                  <CardDescription>Daily user registration trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={registrationsByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="registrations" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                        name="Registrations"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Role Requests</CardTitle>
                <CardDescription>Approve or reject driver and hotel owner applications</CardDescription>
              </CardHeader>
              <CardContent>
                {roleRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No role requests</p>
                ) : (
                  <div className="space-y-4">
                    {roleRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">User ID: {request.user_id.slice(0, 8)}...</p>
                          <p className="text-sm text-muted-foreground">
                            Requested: <Badge variant="outline">{request.requested_role}</Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.created_at), "MMM dd, yyyy HH:mm")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            request.status === 'approved' ? 'bg-green-500' :
                            request.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                          }>
                            {request.status}
                          </Badge>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleRoleRequest(request.id, request.user_id, request.requested_role, 'approved')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRoleRequest(request.id, request.user_id, request.requested_role, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Registered Users</CardTitle>
                <CardDescription>All registered users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{u.full_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">ID: {u.id.slice(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {format(new Date(u.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {u.roles.length === 0 ? (
                          <Badge variant="outline">user</Badge>
                        ) : (
                          u.roles.map((role) => (
                            <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                              {role}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>Complete booking history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {booking.booking_type === 'vehicle' ? (
                            <Car className="h-5 w-5 text-primary" />
                          ) : (
                            <Hotel className="h-5 w-5 text-primary" />
                          )}
                          <span className="font-medium">
                            {booking.booking_type === 'vehicle' 
                              ? booking.vehicles?.model 
                              : booking.hotels?.hotel_name}
                          </span>
                        </div>
                        <Badge className={booking.booking_status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}>
                          {booking.booking_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total: USD {Number(booking.total_amount).toFixed(2)} | 
                        {format(new Date(booking.created_at), " MMM dd, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle>All Vehicles</CardTitle>
                <CardDescription>Manage listed vehicles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-4 border rounded-lg">
                      {vehicle.image_url && (
                        <img src={vehicle.image_url} alt={vehicle.model} className="w-full h-32 object-cover rounded mb-3" />
                      )}
                      <h4 className="font-medium">{vehicle.model}</h4>
                      <p className="text-sm text-muted-foreground">{vehicle.vehicle_type}</p>
                      <p className="text-sm font-medium text-primary">USD {vehicle.per_km_charge}/km</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hotels">
            <Card>
              <CardHeader>
                <CardTitle>All Hotels</CardTitle>
                <CardDescription>Manage listed hotels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="p-4 border rounded-lg">
                      {hotel.image_url && (
                        <img src={hotel.image_url} alt={hotel.hotel_name} className="w-full h-32 object-cover rounded mb-3" />
                      )}
                      <h4 className="font-medium">{hotel.hotel_name}</h4>
                      <p className="text-sm text-muted-foreground">{hotel.city} | {hotel.category}</p>
                      <p className="text-sm font-medium text-primary">USD {hotel.per_night_charge}/night</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
