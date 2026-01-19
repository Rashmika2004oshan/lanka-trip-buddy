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
  hotelName: z.string().min(1, "Hotel name is required").max(100, "Hotel name must be less than 100 characters"),
  stars: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 5, {
    message: "Stars must be between 1 and 5"
  }),
  perNightCharge: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 1000000, {
    message: "Per night charge must be a positive number (max 1,000,000)"
  }),
  category: z.enum(["Luxury", "Middle", "Low"]),
  city: z.string().min(1, "City is required").max(100, "City must be less than 100 characters"),
  image: z.any()
    .refine((files) => files?.length > 0, "Image is required")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, "Max file size is 5MB")
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only JPEG, PNG, and WebP images are allowed"
    ),
});

type FormData = z.infer<typeof formSchema>;

const HotelSurvey = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState<string>("");

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit your hotel",
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
      
      // Validate file extension matches content type
      const validExtensions: Record<string, string[]> = {
        'image/jpeg': ['jpg', 'jpeg'],
        'image/png': ['png'],
        'image/webp': ['webp'],
      };
      
      if (!fileExt || !validExtensions[file.type]?.includes(fileExt)) {
        throw new Error("File extension does not match file type");
      }
      
      // Use crypto.randomUUID for secure unique filename
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('hotel-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const imageUrl = supabase.storage.from('hotel-images').getPublicUrl(fileName).data.publicUrl;

      // Insert hotel data
      const { error: insertError } = await supabase
        .from('hotels')
        .insert({
          user_id: user.id,
          hotel_name: data.hotelName,
          stars: Number(data.stars),
          per_night_charge: Number(data.perNightCharge),
          category: data.category,
          city: data.city,
          image_url: imageUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: "Your hotel has been listed successfully",
      });

      navigate("/accommodation");
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Hotel Owner Survey Form</h1>
          <p className="text-muted-foreground mb-8">List your hotel for travelers</p>

          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="hotelName">Hotel Name</Label>
                <Input
                  id="hotelName"
                  {...register("hotelName")}
                  placeholder="e.g., Grand Beach Resort"
                />
                {errors.hotelName && (
                  <p className="text-sm text-destructive mt-1">{errors.hotelName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="stars">Stars</Label>
                <Input
                  id="stars"
                  type="number"
                  min="1"
                  max="5"
                  {...register("stars")}
                  placeholder="1-5"
                />
                {errors.stars && (
                  <p className="text-sm text-destructive mt-1">{errors.stars.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="perNightCharge">Per Night Charge (USD)</Label>
                <Input
                  id="perNightCharge"
                  type="number"
                  step="0.01"
                  {...register("perNightCharge")}
                  placeholder="e.g., 120.00"
                />
                {errors.perNightCharge && (
                  <p className="text-sm text-destructive mt-1">{errors.perNightCharge.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(value) => {
                    setCategory(value);
                    setValue("category", value as "Luxury" | "Middle" | "Low");
                  }}
                  value={category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Luxury">Luxury</SelectItem>
                    <SelectItem value="Middle">Middle</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="e.g., Colombo, Kandy"
                />
                {errors.city && (
                  <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="image">Hotel Image</Label>
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
                  "Submit Hotel"
                )}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HotelSurvey;
