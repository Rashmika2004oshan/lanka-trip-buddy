import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import PlacesSection from "@/components/PlacesSection";
import MapSection from "@/components/MapSection";
import ItineraryPlanner from "@/components/ItineraryPlanner";
import TrainScheduleSection from "@/components/TrainScheduleSection";
import Chatbot from "@/components/Chatbot";

const Index = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <AboutSection />
      <PlacesSection />
      <MapSection />
      <ItineraryPlanner />
      <TrainScheduleSection />
      <Chatbot />
      
      <footer className="bg-foreground text-background py-8 px-4 text-center">
        <p className="text-sm">
          © 2024 Discover Sri Lanka. Experience the Pearl of the Indian Ocean.
        </p>
      </footer>
    </main>
  );
};

export default Index;
