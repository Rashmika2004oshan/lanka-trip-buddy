import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DriverSurvey from "./pages/DriverSurvey";
import HotelSurvey from "./pages/HotelSurvey";
import VehicleRental from "./pages/VehicleRental";
import Accommodation from "./pages/Accommodation";
import Weather from "./pages/Weather";
import MyBookings from "./pages/MyBookings";
import SavedItineraries from "./pages/SavedItineraries";
import AdminDashboard from "./pages/AdminDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import HotelOwnerDashboard from "./pages/HotelOwnerDashboard";
import MapDirections from "./pages/MapDirections";
import TrainBooking from "./pages/TrainBooking";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/driver-survey" element={<DriverSurvey />} />
          <Route path="/hotel-survey" element={<HotelSurvey />} />
          <Route path="/vehicle-rental" element={<VehicleRental />} />
          <Route path="/accommodation" element={<Accommodation />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/saved-itineraries" element={<SavedItineraries />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/driver-dashboard" element={<DriverDashboard />} />
          <Route path="/hotel-owner-dashboard" element={<HotelOwnerDashboard />} />
          <Route path="/map" element={<MapDirections />} />
          <Route path="/train-booking" element={<TrainBooking />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

