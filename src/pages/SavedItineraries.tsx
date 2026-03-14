import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trash2, Loader2, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";

interface SavedItinerary { id: string; title: string; days: number; interests: string[]; itinerary_data: any; created_at: string; }

const SavedItineraries = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);
  useEffect(() => { if (user) fetchItineraries(); }, [user]);

  const fetchItineraries = async () => {
    try {
      const { data, error } = await supabase.from("saved_itineraries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setItineraries((data || []) as SavedItinerary[]);
    } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
  };

  const deleteItinerary = async (id: string) => {
    try {
      const { error } = await supabase.from("saved_itineraries").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("common.delete") + " ✓");
      fetchItineraries();
    } catch (error) { toast.error(t("common.error")); }
  };

  const parseInterests = (interests: any): string[] => {
    if (Array.isArray(interests)) return interests;
    if (typeof interests === 'string') { try { return JSON.parse(interests); } catch { return []; } }
    return [];
  };

  const downloadPDF = (itinerary: SavedItinerary) => {
    const doc = new jsPDF();
    const interests = parseInterests(itinerary.interests);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(24, 106, 171); doc.rect(0, 0, pageWidth, 40, "F");
    doc.setFontSize(20); doc.setTextColor(255, 255, 255);
    doc.text("Sri Lanka Travel Itinerary", pageWidth / 2, 17, { align: "center" });
    doc.setFontSize(11); doc.text("Lanka Trip Buddy", pageWidth / 2, 28, { align: "center" });
    doc.setFillColor(245, 247, 250); doc.rect(0, 40, pageWidth, 45, "F");
    doc.setFontSize(12); doc.setTextColor(24, 106, 171); doc.text(itinerary.title, 15, 52);
    doc.setFontSize(10); doc.setTextColor(60, 60, 60);
    if (user?.email) doc.text(`${t("profile.email")}: ${user.email}`, 15, 62);
    doc.text(`${t("savedItineraries.duration")}: ${itinerary.days} ${t("common.days")}`, 15, 71);
    const guests = (itinerary as any).guests;
    if (guests) doc.text(`${t("myBookings.guests")}: ${guests}`, pageWidth / 2, 62);
    doc.text(`${t("savedItineraries.createdOn")}: ${format(new Date(itinerary.created_at), "MMMM dd, yyyy")}`, pageWidth / 2, 71);
    doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text(`${t("savedItineraries.interests")}: ${interests.join(", ")}`, 15, 80);
    doc.setDrawColor(180, 180, 180); doc.line(15, 86, pageWidth - 15, 86);
    let yPos = 96;
    const plan: any[] = itinerary.itinerary_data?.plan || [];
    if (plan.length > 0) {
      doc.setFontSize(12); doc.setTextColor(24, 106, 171); doc.text("Daily Destinations", 15, yPos); yPos += 10;
      plan.forEach((dayPlan: any, index: number) => {
        if (yPos > 255) { doc.addPage(); yPos = 20; }
        doc.setFillColor(24, 106, 171); doc.roundedRect(15, yPos - 5, 28, 8, 2, 2, "F");
        doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.text(`Day ${dayPlan.day}`, 29, yPos + 1, { align: "center" });
        doc.setFontSize(10); doc.setTextColor(30, 30, 30);
        const actText = doc.splitTextToSize(dayPlan.activity || "", pageWidth - 60); doc.text(actText, 48, yPos + 1);
        yPos += actText.length * 5 + 5;
        doc.setFontSize(9); doc.setTextColor(100, 100, 100);
        doc.text(`📍 ${dayPlan.hotel || ""} (${dayPlan.hotelCity || ""})  |  🚗 ${dayPlan.transport || ""}  |  💵 $${Number(dayPlan.dailyTotal || 0).toFixed(2)}/day`, 18, yPos); yPos += 10;
        if (index < plan.length - 1) { doc.setDrawColor(230, 230, 230); doc.line(15, yPos - 3, pageWidth - 15, yPos - 3); }
      }); yPos += 5;
    }
    if (itinerary.itinerary_data?.totalCost) {
      if (yPos > 260) { doc.addPage(); yPos = 20; }
      doc.setFillColor(24, 106, 171); doc.rect(15, yPos + 2, pageWidth - 30, 14, "F");
      doc.setFontSize(13); doc.setTextColor(255, 255, 255);
      doc.text(`Total Budget: USD ${Number(itinerary.itinerary_data.totalCost).toFixed(2)}`, pageWidth / 2, yPos + 12, { align: "center" });
    }
    doc.setFontSize(8); doc.setTextColor(160, 160, 160);
    doc.text("Lanka Trip Buddy", pageWidth / 2, 286, { align: "center" });
    doc.save(`${itinerary.title.replace(/\s+/g, "-")}-itinerary.pdf`);
    toast.success("PDF ✓");
  };

  if (authLoading || loading) return (<div className="min-h-screen"><Header /><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t("savedItineraries.title")}</h1>
          <p className="text-muted-foreground">{t("savedItineraries.subtitle")}</p>
        </div>
        {itineraries.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16">
            <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("savedItineraries.noItineraries")}</h3>
            <p className="text-muted-foreground mb-4">{t("savedItineraries.createPlan")}</p>
            <Button onClick={() => navigate("/")}>{t("savedItineraries.createItinerary")}</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {itineraries.map((itinerary) => (
              <Card key={itinerary.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-start justify-between">
                    <div><CardTitle className="text-xl mb-2">{itinerary.title}</CardTitle><CardDescription>{t("savedItineraries.createdOn")} {format(new Date(itinerary.created_at), "MMM dd, yyyy")}</CardDescription></div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="text-primary" onClick={() => downloadPDF(itinerary)}><Download className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>{t("savedItineraries.deleteItinerary")}</AlertDialogTitle><AlertDialogDescription>{t("savedItineraries.deleteConfirm").replace("{title}", itinerary.title)}</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => deleteItinerary(itinerary.id)}>{t("common.delete")}</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{t("savedItineraries.duration")}:</span><span className="font-medium">{itinerary.days} {t("common.days")}</span></div>
                    <div><p className="text-sm text-muted-foreground mb-2">{t("savedItineraries.interests")}:</p><div className="flex flex-wrap gap-2">{parseInterests(itinerary.interests).map((interest: string, index: number) => (<Badge key={index} variant="secondary">{interest}</Badge>))}</div></div>
                    {itinerary.itinerary_data?.hotel && (<div className="border-t pt-4"><p className="text-sm font-medium mb-2">{t("savedItineraries.accommodation")}</p><p className="text-sm text-muted-foreground">{itinerary.itinerary_data.hotel.hotel_name} - {itinerary.itinerary_data.hotel.city}</p><p className="text-xs text-muted-foreground mt-1">USD {itinerary.itinerary_data.hotel.per_night_charge}{t("hotels.perNight")}</p></div>)}
                    {itinerary.itinerary_data?.vehicle && (<div className="border-t pt-4"><p className="text-sm font-medium mb-2">{t("savedItineraries.transport")}</p><p className="text-sm text-muted-foreground">{itinerary.itinerary_data.vehicle.vehicle_type} - {itinerary.itinerary_data.vehicle.model}</p><p className="text-xs text-muted-foreground mt-1">USD {itinerary.itinerary_data.vehicle.per_km_charge}{t("vehicles.perKm")}</p></div>)}
                    {itinerary.itinerary_data?.totalCost && (<div className="border-t pt-4"><div className="flex justify-between items-center"><span className="text-sm font-medium">{t("savedItineraries.estimatedTotal")}:</span><span className="text-lg font-bold text-primary">USD {Number(itinerary.itinerary_data.totalCost).toFixed(2)}</span></div></div>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedItineraries;
