import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import PlacesSection from "@/components/PlacesSection";
import ItineraryPlanner from "@/components/ItineraryPlanner";
import TrainScheduleSection from "@/components/TrainScheduleSection";
import Chatbot from "@/components/Chatbot";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <PlacesSection />
        <ItineraryPlanner />
        <TrainScheduleSection />
        <Chatbot />
        
        <footer className="bg-foreground py-10 px-6">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-background/60 text-sm">
              © 2024 Sri Lanka Travel. Experience the Pearl of the Indian Ocean.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
