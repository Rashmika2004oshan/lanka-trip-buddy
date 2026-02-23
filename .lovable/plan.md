

## Plan: Homepage Cleanup, Currency Update, Admin Navigation, Train Booking Notifications, and OpenRoute API

### 1. Remove Google Maps from Homepage

Remove the `<MapSection />` component from `src/pages/Index.tsx`. The Leaflet-based Map Directions page (`/map`) already provides superior mapping functionality.

### 2. Change All Prices from LKR to USD

Replace all instances of "LKR" with "USD" across the following files (keeping all numbers the same):

- `src/components/BookingDialog.tsx` (6 instances)
- `src/pages/AdminDashboard.tsx` (5 instances)
- `src/pages/SavedItineraries.tsx` (5 instances)
- `src/pages/MyBookings.tsx` (3 instances)
- `src/pages/DriverDashboard.tsx` (3 instances)
- `src/pages/HotelOwnerDashboard.tsx` (3 instances)
- `src/pages/VehicleRental.tsx` (1 instance)
- `src/pages/Accommodation.tsx` (1 instance)
- `supabase/functions/send-booking-notification/index.ts` (3 instances in email HTML)

### 3. Admin Navigation Link (Only for Admin User)

The admin link in the Header already only shows when `isAdmin` is true (checked via the `useUserRole` hook and the `user_roles` table). Since `oshancshan@gmail.com` is already set as admin in the database, no changes are needed for access control. The "Admin" button in the navigation bar is already conditionally rendered.

### 4. Train Booking Email Notification to Admin

Update `src/pages/TrainBooking.tsx`:
- Require authentication to book a train
- When a user clicks "Book This Train", call the existing `send-booking-notification` edge function with `bookingType: "train"` and train details (train name, number, route, departure/arrival times)

Update `supabase/functions/send-booking-notification/index.ts`:
- Add a third booking type handler for `"train"` that formats train-specific details (train name, number, from/to stations, departure, arrival, class)
- Send notification email to admin and confirmation to customer

### 5. Use Provided OpenRouteService API Key

The API key `eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImJmOGIxMjI4ZGM4YzQxMWU5OTkzZWViOTI3NjQ5MzI0IiwiaCI6Im11cm11cjY0In0=` is already hardcoded in `src/pages/MapDirections.tsx` (line 11). No changes needed here.

---

### Technical Details

**Files to modify:**
1. `src/pages/Index.tsx` -- remove MapSection import and usage
2. `src/components/BookingDialog.tsx` -- LKR to USD
3. `src/pages/AdminDashboard.tsx` -- LKR to USD
4. `src/pages/SavedItineraries.tsx` -- LKR to USD
5. `src/pages/MyBookings.tsx` -- LKR to USD
6. `src/pages/DriverDashboard.tsx` -- LKR to USD
7. `src/pages/HotelOwnerDashboard.tsx` -- LKR to USD
8. `src/pages/VehicleRental.tsx` -- LKR to USD
9. `src/pages/Accommodation.tsx` -- LKR to USD
10. `supabase/functions/send-booking-notification/index.ts` -- LKR to USD + add train booking type
11. `src/pages/TrainBooking.tsx` -- add auth check and email notification on booking

