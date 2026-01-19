import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  bookingType: string;
  bookingDetails: any;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { bookingType, bookingDetails, customerEmail, customerName, totalAmount }: BookingNotificationRequest = await req.json();
    
    // Input validation
    if (!bookingType || !bookingDetails || !customerEmail || !customerName || totalAmount === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize inputs for email (basic HTML escaping)
    const escapeHtml = (str: string): string => {
      if (typeof str !== 'string') return String(str);
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    
    if (!adminEmail) {
      throw new Error("Admin email not configured");
    }

    // Format booking details based on type with sanitized values
    let detailsHtml = "";
    const recipients = [adminEmail];

    if (bookingType === "vehicle") {
      detailsHtml = `
        <h3>Vehicle Booking Details</h3>
        <p><strong>Vehicle:</strong> ${escapeHtml(bookingDetails.vehicleModel)}</p>
        <p><strong>Vehicle Type:</strong> ${escapeHtml(bookingDetails.vehicleType)}</p>
        <p><strong>Rental Start:</strong> ${escapeHtml(bookingDetails.rentalStartDate)}</p>
        <p><strong>Rental End:</strong> ${escapeHtml(bookingDetails.rentalEndDate)}</p>
        <p><strong>Estimated KM:</strong> ${escapeHtml(bookingDetails.estimatedKm)}</p>
      `;
      // Add driver/owner email if available
      if (bookingDetails.ownerEmail) {
        recipients.push(bookingDetails.ownerEmail);
      }
    } else {
      detailsHtml = `
        <h3>Accommodation Booking Details</h3>
        <p><strong>Hotel:</strong> ${escapeHtml(bookingDetails.hotelName)}</p>
        <p><strong>City:</strong> ${escapeHtml(bookingDetails.city)}</p>
        <p><strong>Check-in:</strong> ${escapeHtml(bookingDetails.checkInDate)}</p>
        <p><strong>Check-out:</strong> ${escapeHtml(bookingDetails.checkOutDate)}</p>
        <p><strong>Number of Nights:</strong> ${escapeHtml(String(bookingDetails.numberOfNights))}</p>
        <p><strong>Number of Persons:</strong> ${escapeHtml(String(bookingDetails.numberOfPersons))}</p>
        <p><strong>Room Type:</strong> ${escapeHtml(bookingDetails.roomType)}</p>
      `;
      // Add hotel owner email if available
      if (bookingDetails.ownerEmail) {
        recipients.push(bookingDetails.ownerEmail);
      }
    }

    console.log("Sending notification to:", recipients);

    const emailResponse = await resend.emails.send({
      from: "Sri Lanka Travel <onboarding@resend.dev>",
      to: recipients,
      subject: `New ${bookingType === 'vehicle' ? 'Vehicle' : 'Accommodation'} Booking`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Booking Notification</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${escapeHtml(customerName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${detailsHtml}
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Information</h3>
            <p><strong>Subtotal:</strong> LKR ${escapeHtml(bookingDetails.subtotal)}</p>
            <p><strong>Service Charge (10%):</strong> LKR ${escapeHtml(bookingDetails.serviceCharge)}</p>
            <p style="font-size: 18px; font-weight: bold;"><strong>Total Amount:</strong> LKR ${escapeHtml(String(totalAmount))}</p>
            <p><strong>Payment Method:</strong> Card (Demo)</p>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This is an automated notification from your Sri Lanka Travel booking system.
          </p>
        </div>
      `,
    });

    console.log("Booking notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-notification function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
