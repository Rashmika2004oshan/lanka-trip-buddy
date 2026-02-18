import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Trash2, Navigation, Route, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImJmOGIxMjI4ZGM4YzQxMWU5OTkzZWViOTI3NjQ5MzI0IiwiaCI6Im11cm11cjY0In0=";

// Popular Sri Lanka landmarks for quick add
const SRI_LANKA_PLACES = [
  { name: "Colombo", coords: [6.9271, 79.8612] as [number, number] },
  { name: "Kandy", coords: [7.2906, 80.6337] as [number, number] },
  { name: "Galle", coords: [6.0535, 80.2210] as [number, number] },
  { name: "Sigiriya", coords: [7.9570, 80.7603] as [number, number] },
  { name: "Ella", coords: [6.8667, 81.0466] as [number, number] },
  { name: "Anuradhapura", coords: [8.3114, 80.4037] as [number, number] },
  { name: "Trincomalee", coords: [8.5874, 81.2152] as [number, number] },
  { name: "Nuwara Eliya", coords: [6.9497, 80.7891] as [number, number] },
];

interface Stop {
  id: string;
  name: string;
  coords: [number, number] | null;
  inputValue: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
  geometry: [number, number][];
}

const MapDirections = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [stops, setStops] = useState<Stop[]>([
    { id: "1", name: "", coords: null, inputValue: "" },
    { id: "2", name: "", coords: null, inputValue: "" },
  ]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const initMap = async () => {
      const L = await import("leaflet");
      
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [7.8731, 80.7718],
        zoom: 7,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMap.current = map;
    };

    initMap();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  const geocodePlace = async (stopId: string, query: string) => {
    if (!query.trim()) return;
    setGeocodeLoading(stopId);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Sri Lanka")}&format=json&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        updateStop(stopId, { coords: [parseFloat(lat), parseFloat(lon)], name: display_name.split(",")[0] });
        toast.success(`Located: ${display_name.split(",")[0]}`);
      } else {
        toast.error("Location not found. Try a different name.");
      }
    } catch {
      toast.error("Failed to find location");
    } finally {
      setGeocodeLoading(null);
    }
  };

  const updateStop = (id: string, updates: Partial<Stop>) => {
    setStops(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addStop = () => {
    if (stops.length >= 8) {
      toast.error("Maximum 8 stops allowed");
      return;
    }
    setStops(prev => [...prev, {
      id: Date.now().toString(),
      name: "",
      coords: null,
      inputValue: "",
    }]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) {
      toast.error("Minimum 2 stops required");
      return;
    }
    setStops(prev => prev.filter(s => s.id !== id));
  };

  const addQuickPlace = (place: typeof SRI_LANKA_PLACES[0]) => {
    const emptyStop = stops.find(s => !s.coords);
    if (emptyStop) {
      updateStop(emptyStop.id, { coords: place.coords, name: place.name, inputValue: place.name });
    } else {
      if (stops.length < 8) {
        setStops(prev => [...prev, {
          id: Date.now().toString(),
          name: place.name,
          coords: place.coords,
          inputValue: place.name,
        }]);
      }
    }
  };

  const clearMarkers = async () => {
    const L = await import("leaflet");
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
  };

  const getDirections = async () => {
    const validStops = stops.filter(s => s.coords);
    if (validStops.length < 2) {
      toast.error("Please add at least 2 locations");
      return;
    }

    setLoading(true);
    try {
      const L = await import("leaflet");
      await clearMarkers();

      // Place markers
      const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
      validStops.forEach((stop, i) => {
        if (!stop.coords || !leafletMap.current) return;
        const icon = L.divIcon({
          html: `<div style="background:${colors[i % colors.length]};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${i + 1}</div>`,
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker(stop.coords, { icon })
          .addTo(leafletMap.current)
          .bindPopup(`<b>Stop ${i + 1}</b><br/>${stop.name || stop.inputValue}`);
        markersRef.current.push(marker);
      });

      // Build coordinates for ORS
      const coordinates = validStops.map(s => [s.coords![1], s.coords![0]]);

      const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
        method: "POST",
        headers: {
          "Authorization": ORS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coordinates }),
      });

      if (!response.ok) {
        throw new Error(`ORS API error: ${response.status}`);
      }

      const data = await response.json();
      const feature = data.features[0];
      const summary = feature.properties.summary;
      const coords = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);

      // Draw route
      if (leafletMap.current) {
        routeLayerRef.current = L.polyline(coords, {
          color: "#186aab",
          weight: 5,
          opacity: 0.8,
          dashArray: undefined,
        }).addTo(leafletMap.current);

        // Fit map to route
        leafletMap.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });
      }

      setRouteInfo({
        distance: summary.distance / 1000,
        duration: summary.duration / 3600,
        geometry: coords,
      });
      toast.success("Route calculated!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to get directions. Check your locations and try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m} min`;
    return `${h}h ${m}min`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Route className="h-8 w-8 text-primary" />
              Route Planner
            </h1>
            <p className="text-muted-foreground mt-1">Plan your journey across Sri Lanka with multiple stops</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Controls Panel */}
            <div className="lg:col-span-1 space-y-4">
              {/* Quick Places */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Add Places</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {SRI_LANKA_PLACES.map(place => (
                      <Badge
                        key={place.name}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => addQuickPlace(place)}
                      >
                        {place.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Stops */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Your Stops
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stops.map((stop, index) => (
                    <div key={stop.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <Input
                          placeholder={index === 0 ? "Start location" : index === stops.length - 1 ? "End location" : `Stop ${index + 1}`}
                          value={stop.inputValue}
                          onChange={e => updateStop(stop.id, { inputValue: e.target.value, coords: null, name: "" })}
                          onKeyDown={e => {
                            if (e.key === "Enter") geocodePlace(stop.id, stop.inputValue);
                          }}
                          className="h-9 text-sm"
                        />
                        {stop.coords && (
                          <p className="text-xs text-accent truncate">✓ {stop.name || stop.inputValue}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {geocodeLoading === stop.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => geocodePlace(stop.id, stop.inputValue)}
                            disabled={!stop.inputValue}
                          >
                            <Navigation className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeStop(stop.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full" onClick={addStop} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stop
                  </Button>

                  <Button
                    className="w-full bg-gradient-tropical text-primary-foreground hover:opacity-90"
                    onClick={getDirections}
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Calculating...</>
                    ) : (
                      <><Route className="h-4 w-4 mr-2" />Get Directions</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Route Info */}
              {routeInfo && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-primary">Route Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Route className="h-4 w-4" /> Total Distance
                      </span>
                      <span className="font-bold text-foreground">{routeInfo.distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> Est. Duration
                      </span>
                      <span className="font-bold text-foreground">{formatDuration(routeInfo.duration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Stops</span>
                      <span className="font-bold text-foreground">{stops.filter(s => s.coords).length}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden h-full min-h-[500px] lg:min-h-[600px]">
                <div ref={mapRef} className="w-full h-full min-h-[500px] lg:min-h-[600px]" />
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
    </div>
  );
};

export default MapDirections;
