import { Button } from "@/components/ui/button";
import { Train } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

const TrainScheduleSection = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <section id="train-schedule" className="py-20 px-4 bg-gradient-subtle">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-500 delay-200">
            <Train className="h-8 w-8 text-primary animate-in fade-in slide-in-from-left-4 duration-300 delay-100" />
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground animate-in fade-in slide-in-from-bottom-6 duration-800 delay-300">
              {t("nav.trains")}
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-600 delay-500">
            {t("trains.subtitle")}
          </p>
        </div>

        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
          <Button
            size="lg"
            className="bg-gradient-tropical hover:opacity-90 text-white font-semibold gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={() => navigate("/train-booking")}
          >
            <Train className="w-5 h-5" />
            {t("trains.searchTrains")}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TrainScheduleSection;
