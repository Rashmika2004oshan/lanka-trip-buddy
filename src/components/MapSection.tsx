import { MapPin } from "lucide-react";

const MapSection = () => {
  return (
    <section id="map" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center items-center gap-2">
            <MapPin className="w-8 h-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Find Your Way
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore Sri Lanka's geography and plan your route across this beautiful island
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-elevated border border-border/30">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4046980.7335278783!2d78.0422174!3d7.873054!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2593cf65a1e9d%3A0xe13da4b400e2d38c!2sSri%20Lanka!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
            width="100%"
            height="500"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Sri Lanka Map"
          />
        </div>
      </div>
    </section>
  );
};

export default MapSection;
