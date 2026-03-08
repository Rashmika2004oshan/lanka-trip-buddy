import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import PlacesSection from "@/components/PlacesSection";
import ItineraryPlanner from "@/components/ItineraryPlanner";
import TrainScheduleSection from "@/components/TrainScheduleSection";
import Chatbot from "@/components/Chatbot";
import { Mail, Phone, Clock, MapPin, Headphones } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const Index = () => {
  const { t } = useI18n();

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

        {/* Technical Support Section */}
        <section id="support" className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <div className="flex justify-center items-center gap-2 mb-3">
                <Headphones className="w-7 h-7 text-primary" />
                <h2 className="text-3xl font-bold text-foreground">{t("support.title")}</h2>
              </div>
              <p className="text-muted-foreground">{t("support.description")}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card border border-border/50 rounded-xl p-6 text-center hover:shadow-card transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{t("support.email")}</h3>
                <a href="mailto:oshancshan@gmail.com" className="text-sm text-primary hover:underline">
                  oshancshan@gmail.com
                </a>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-6 text-center hover:shadow-card transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{t("support.phone")}</h3>
                <a href="tel:+94771234567" className="text-sm text-primary hover:underline">
                  +94 77 123 4567
                </a>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-6 text-center hover:shadow-card transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{t("support.hours")}</h3>
                <p className="text-sm text-muted-foreground">{t("support.workingHours1")}</p>
                <p className="text-sm text-muted-foreground">{t("support.workingHours2")}</p>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-6 text-center hover:shadow-card transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{t("support.office")}</h3>
                <p className="text-sm text-muted-foreground">{t("support.location")}</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-foreground py-10 px-6">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-background/60 text-sm">
              {t("footer.copyright")}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
