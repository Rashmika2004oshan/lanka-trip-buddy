import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    const { bookingType, bookingDetails, customerEmail, customerName, totalAmount }: BookingNotificationRequest = await req.json();
    
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    
    if (!adminEmail) {
      throw new Error("Admin email not configured");
    }

    // Format booking details based on type
    let detailsHtml = "";
    if (bookingType === "vehicle") {
      detailsHtml = `
        <h3>Vehicle Booking Details</h3>
        <p><strong>Vehicle:</strong> ${bookingDetails.vehicleModel}</p>
        <p><strong>Vehicle Type:</strong> ${bookingDetails.vehicleType}</p>
        <p><strong>Rental Start:</strong> ${bookingDetails.rentalStartDate}</p>
        <p><strong>Rental End:</strong> ${bookingDetails.rentalEndDate}</p>
        <p><strong>Estimated KM:</strong> ${bookingDetails.estimatedKm}</p>
      `;
    } else {
      detailsHtml = `
        <h3>Accommodation Booking Details</h3>
        <p><strong>Hotel:</strong> ${bookingDetails.hotelName}</p>
        <p><strong>City:</strong> ${bookingDetails.city}</p>
        <p><strong>Check-in:</strong> ${bookingDetails.checkInDate}</p>
        <p><strong>Check-out:</strong> ${bookingDetails.checkOutDate}</p>
        <p><strong>Number of Nights:</strong> ${bookingDetails.numberOfNights}</p>
        <p><strong>Number of Persons:</strong> ${bookingDetails.numberOfPersons}</p>
        <p><strong>Room Type:</strong> ${bookingDetails.roomType}</p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Sri Lanka Travel <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `New ${bookingType === 'vehicle' ? 'Vehicle' : 'Accommodation'} Booking`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Booking Notification</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${detailsHtml}
          </div>
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Payment Information</h3>
            <p><strong>Subtotal:</strong> LKR ${bookingDetails.subtotal}</p>
            <p><strong>Service Charge (10%):</strong> LKR ${bookingDetails.serviceCharge}</p>
            <p style="font-size: 18px; font-weight: bold;"><strong>Total Amount:</strong> LKR ${totalAmount}</p>
            <p><strong>Payment Method:</strong> Card (****${bookingDetails.cardLastFour})</p>
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
