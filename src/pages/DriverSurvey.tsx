import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formSchema = z.object({
  vehicleType: z.enum(["Car", "Van", "Bus"], { required_error: "Vehicle type is required" }),
  vehicleCategory: z.enum(["Mid", "Luxury"], { required_error: "Vehicle category is required" }),
  model: z.string().min(1, "Model is required").max(100, "Model must be less than 100 characters"),
  vehicleNumber: z.string().min(1, "Vehicle number is required").max(20, "Vehicle number must be less than 20 characters"),
  perKmCharge: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 10000, {
    message: "Per km charge must be a positive number (max 10,000)"
  }),
  image: z.any()
    .refine((files) => files?.length > 0, "Image is required")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, "Max file size is 5MB")
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only JPEG, PNG, and WebP images are allowed"
    ),
});

type FormData = z.infer<typeof formSchema>;

const DriverSurvey = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleType, setVehicleType] = useState<string>("");
  const [vehicleCategory, setVehicleCategory] = useState<string>("");

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit your vehicle",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image with secure filename
      const file = data.image[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      const validExtensions: Record<string, string[]> = {
        'image/jpeg': ['jpg', 'jpeg'],
        'image/png': ['png'],
        'image/webp': ['webp'],
      };
      
      if (!fileExt || !validExtensions[file.type]?.includes(fileExt)) {
        throw new Error("File extension does not match file type");
      }
      
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const imageUrl = supabase.storage.from('vehicle-images').getPublicUrl(fileName).data.publicUrl;

      const { error: insertError } = await supabase
        .from('vehicles')
        .insert({
          user_id: user.id,
          vehicle_type: data.vehicleType,
          vehicle_category: data.vehicleCategory,
          model: data.model,
          vehicle_number: data.vehicleNumber,
          per_km_charge: Number(data.perKmCharge),
          image_url: imageUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: "Your vehicle has been listed successfully",
      });

      navigate("/vehicle-rental");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Driver Survey Form</h1>
          <p className="text-muted-foreground mb-8">List your vehicle for rental</p>

          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select
                  onValueChange={(value) => {
                    setVehicleType(value);
                    setValue("vehicleType", value as "Car" | "Van" | "Bus");
                  }}
                  value={vehicleType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Car (1-4 passengers)</SelectItem>
                    <SelectItem value="Van">Van (5-7 passengers)</SelectItem>
                    <SelectItem value="Bus">Bus (8+ passengers)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vehicleType && (
                  <p className="text-sm text-destructive mt-1">{errors.vehicleType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="vehicleCategory">Vehicle Category</Label>
                <Select
                  onValueChange={(value) => {
                    setVehicleCategory(value);
                    setValue("vehicleCategory", value as "Mid" | "Luxury");
                  }}
                  value={vehicleCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mid">Mid Range</SelectItem>
                    <SelectItem value="Luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vehicleCategory && (
                  <p className="text-sm text-destructive mt-1">{errors.vehicleCategory.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  {...register("model")}
                  placeholder="e.g., Toyota Prius, Honda CR-V"
                />
                {errors.model && (
                  <p className="text-sm text-destructive mt-1">{errors.model.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  {...register("vehicleNumber")}
                  placeholder="e.g., ABC-1234"
                />
                {errors.vehicleNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.vehicleNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="perKmCharge">Per Km Charge (USD)</Label>
                <Input
                  id="perKmCharge"
                  type="number"
                  step="0.01"
                  {...register("perKmCharge")}
                  placeholder="e.g., 0.50"
                />
                {errors.perKmCharge && (
                  <p className="text-sm text-destructive mt-1">{errors.perKmCharge.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="image">Vehicle Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  {...register("image")}
                />
                {errors.image && (
                  <p className="text-sm text-destructive mt-1">{errors.image.message as string}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Vehicle"
                )}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DriverSurvey;
