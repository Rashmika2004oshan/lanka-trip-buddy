import { Card } from "@/components/ui/card";
import { Train } from "lucide-react";

const TrainScheduleSection = () => {
  return (
    <section id="train-schedule" className="py-20 px-4 bg-gradient-subtle">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Train className="h-8 w-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              Train Schedules
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Plan your railway journey across Sri Lanka with real-time train schedules
          </p>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-elegant">
          <iframe
            src="https://trainschedule.lk/"
            className="w-full h-[800px] border-0"
            title="Sri Lanka Train Schedule"
            loading="lazy"
          />
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <a
              href="https://trainschedule.lk/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              TrainSchedule.lk
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrainScheduleSection;
