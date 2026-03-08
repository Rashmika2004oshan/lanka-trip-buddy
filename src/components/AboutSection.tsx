import { Card, CardContent } from "@/components/ui/card";
import { Scroll, Landmark, Palmtree } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const AboutSection = () => {
  const { t } = useI18n();

  const features = [
    {
      icon: Scroll,
      title: t("about.feature1.title"),
      description: t("about.feature1.desc"),
      gradient: "bg-gradient-tropical",
    },
    {
      icon: Landmark,
      title: t("about.feature2.title"),
      description: t("about.feature2.desc"),
      gradient: "bg-gradient-sunset",
    },
    {
      icon: Palmtree,
      title: t("about.feature3.title"),
      description: t("about.feature3.desc"),
      gradient: "bg-primary",
    },
  ];

  return (
    <section id="about" className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-3">
          <p className="text-sm font-medium text-primary tracking-wide uppercase">{t("about.label")}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("about.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("about.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {features.map((f, i) => (
            <Card key={i} className="shadow-card hover:shadow-elevated transition-all duration-300 border-border/50 group">
              <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                <div className={`w-12 h-12 ${f.gradient} rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/50 rounded-2xl p-8 md:p-10 border border-border/40">
          <h3 className="text-2xl font-bold text-foreground mb-5">{t("about.historyTitle")}</h3>
          <div className="space-y-4 text-muted-foreground text-sm leading-relaxed columns-1 md:columns-2 gap-8">
            <p>{t("about.history1")}</p>
            <p>{t("about.history2")}</p>
            <p>{t("about.history3")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
