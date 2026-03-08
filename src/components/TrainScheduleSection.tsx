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
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Train className="h-8 w-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              {t("nav.trains")}
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("trains.subtitle")}
          </p>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-tropical hover:opacity-90 text-white font-semibold gap-2"
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
