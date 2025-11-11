import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Cloud, Droplets, Wind, Eye, Gauge, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WeatherData {
  name: string;
  sys: {
    country: string;
  };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  visibility: number;
}

const Weather = () => {
  const [city, setCity] = useState("Colombo");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const API_KEY = "53b5e267bd5ebbb38bdeb37568dfd4a4";

  const fetchWeather = async () => {
    if (!city.trim()) {
      toast({
        title: "Error",
        description: "Please enter a city name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error("City not found");
      }

      const data = await response.json();
      setWeather(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch weather data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Weather Forecast
            </h1>
            <p className="text-lg text-muted-foreground">
              Check the current weather in Sri Lankan cities
            </p>
          </div>

          <Card className="p-6 mb-8 shadow-lg">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter city name..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchWeather()}
                className="flex-1"
              />
              <Button onClick={fetchWeather} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>

          {weather && (
            <div className="space-y-6">
              <Card className="p-8 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-1">
                      {weather.name}, {weather.sys.country}
                    </h2>
                    <p className="text-blue-100 capitalize">
                      {weather.weather[0].description}
                    </p>
                  </div>
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                    alt={weather.weather[0].description}
                    className="w-24 h-24"
                  />
                </div>
                <div className="text-6xl font-bold mb-2">
                  {Math.round(weather.main.temp)}°C
                </div>
                <p className="text-blue-100">
                  Feels like {Math.round(weather.main.feels_like)}°C
                </p>
              </Card>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-muted-foreground">Humidity</span>
                  </div>
                  <p className="text-2xl font-bold">{weather.main.humidity}%</p>
                </Card>

                <Card className="p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Wind className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">Wind Speed</span>
                  </div>
                  <p className="text-2xl font-bold">{weather.wind.speed} m/s</p>
                </Card>

                <Card className="p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-muted-foreground">Visibility</span>
                  </div>
                  <p className="text-2xl font-bold">{weather.visibility / 1000} km</p>
                </Card>

                <Card className="p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Gauge className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-muted-foreground">Pressure</span>
                  </div>
                  <p className="text-2xl font-bold">{weather.main.pressure} hPa</p>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Weather;
