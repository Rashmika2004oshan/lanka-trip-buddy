import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "en" | "si" | "ta";

const translations: Record<Language, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.vehicles": "Vehicles",
    "nav.hotels": "Hotels",
    "nav.weather": "Weather",
    "nav.map": "Map",
    "nav.trains": "Trains",
    "nav.admin": "Admin",
    "nav.signIn": "Sign In",
    "nav.signOut": "Sign Out",
    "hero.title": "Discover Sri Lanka",
    "hero.subtitle": "Experience the Pearl of the Indian Ocean",
    "booking.bookNow": "Book Now",
    "booking.confirmBooking": "Confirm Booking",
    "booking.cancel": "Cancel",
    "booking.alreadyBooked": "This vehicle is already booked for the selected dates",
    "train.passportNumber": "Passport Number",
    "train.passengerName": "Passenger Name",
    "train.numberOfTickets": "Number of Tickets",
    "train.bookTrain": "Book This Train",
    "train.searchTrains": "Search Trains",
    "profile.editProfile": "Edit Profile",
    "profile.myBookings": "My Bookings",
    "profile.savedItineraries": "Saved Itineraries",
    "review.writeReview": "Write a Review",
    "review.rating": "Rating",
    "review.submitReview": "Submit Review",
    "review.reviews": "Reviews",
    "support.title": "Technical Support",
    "support.description": "Need help? Contact our support team",
    "support.email": "Email",
    "support.phone": "Phone",
    "support.hours": "Working Hours",
    "footer.copyright": "© 2024 Sri Lanka Travel. Experience the Pearl of the Indian Ocean.",
    "language": "Language",
  },
  si: {
    "nav.home": "මුල් පිටුව",
    "nav.vehicles": "වාහන",
    "nav.hotels": "හෝටල්",
    "nav.weather": "කාලගුණය",
    "nav.map": "සිතියම",
    "nav.trains": "දුම්රිය",
    "nav.admin": "පරිපාලක",
    "nav.signIn": "පුරන්න",
    "nav.signOut": "පිටවන්න",
    "hero.title": "ශ්‍රී ලංකාව සොයා යන්න",
    "hero.subtitle": "ඉන්දියන් සාගරයේ මුතු ඇටය අත්විඳින්න",
    "booking.bookNow": "දැන් වෙන් කරන්න",
    "booking.confirmBooking": "වෙන්කිරීම තහවුරු කරන්න",
    "booking.cancel": "අවලංගු කරන්න",
    "booking.alreadyBooked": "මෙම වාහනය තෝරාගත් දිනවලට දැනටමත් වෙන් කර ඇත",
    "train.passportNumber": "ගමන් බලපත්‍ර අංකය",
    "train.passengerName": "මගී නම",
    "train.numberOfTickets": "ටිකට් ගණන",
    "train.bookTrain": "මෙම දුම්රිය වෙන් කරන්න",
    "train.searchTrains": "දුම්රිය සොයන්න",
    "profile.editProfile": "පැතිකඩ සංස්කරණය",
    "profile.myBookings": "මගේ වෙන්කිරීම්",
    "profile.savedItineraries": "සුරැකි ගමන් සැලසුම්",
    "review.writeReview": "සමාලෝචනයක් ලියන්න",
    "review.rating": "ශ්‍රේණිගත කිරීම",
    "review.submitReview": "සමාලෝචනය යවන්න",
    "review.reviews": "සමාලෝචන",
    "support.title": "තාක්ෂණික සහාය",
    "support.description": "උදව් අවශ්‍යද? අපගේ සහාය කණ්ඩායම අමතන්න",
    "support.email": "ඊමේල්",
    "support.phone": "දුරකථනය",
    "support.hours": "වැඩ කරන වේලාවන්",
    "footer.copyright": "© 2024 ශ්‍රී ලංකා සංචාරය. ඉන්දියන් සාගරයේ මුතු ඇටය අත්විඳින්න.",
    "language": "භාෂාව",
  },
  ta: {
    "nav.home": "முகப்பு",
    "nav.vehicles": "வாகனங்கள்",
    "nav.hotels": "ஹோட்டல்கள்",
    "nav.weather": "வானிலை",
    "nav.map": "வரைபடம்",
    "nav.trains": "ரயில்கள்",
    "nav.admin": "நிர்வாகி",
    "nav.signIn": "உள்நுழை",
    "nav.signOut": "வெளியேறு",
    "hero.title": "இலங்கையை கண்டறியுங்கள்",
    "hero.subtitle": "இந்தியப் பெருங்கடலின் முத்தை அனுபவியுங்கள்",
    "booking.bookNow": "இப்போதே புக் செய்",
    "booking.confirmBooking": "முன்பதிவை உறுதிப்படுத்து",
    "booking.cancel": "ரத்து செய்",
    "booking.alreadyBooked": "இந்த வாகனம் தேர்ந்தெடுக்கப்பட்ட தேதிகளுக்கு ஏற்கனவே புக் செய்யப்பட்டுள்ளது",
    "train.passportNumber": "கடவுச்சீட்டு எண்",
    "train.passengerName": "பயணியின் பெயர்",
    "train.numberOfTickets": "டிக்கெட் எண்ணிக்கை",
    "train.bookTrain": "இந்த ரயிலை புக் செய்",
    "train.searchTrains": "ரயில்களைத் தேடு",
    "profile.editProfile": "சுயவிவரத்தை திருத்து",
    "profile.myBookings": "எனது முன்பதிவுகள்",
    "profile.savedItineraries": "சேமித்த பயண திட்டங்கள்",
    "review.writeReview": "மதிப்புரை எழுது",
    "review.rating": "மதிப்பீடு",
    "review.submitReview": "மதிப்புரையை சமர்ப்பி",
    "review.reviews": "மதிப்புரைகள்",
    "support.title": "தொழில்நுட்ப ஆதரவு",
    "support.description": "உதவி வேண்டுமா? எங்கள் ஆதரவு குழுவை தொடர்பு கொள்ளுங்கள்",
    "support.email": "மின்னஞ்சல்",
    "support.phone": "தொலைபேசி",
    "support.hours": "வேலை நேரம்",
    "footer.copyright": "© 2024 இலங்கை பயணம். இந்தியப் பெருங்கடலின் முத்தை அனுபவியுங்கள்.",
    "language": "மொழி",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  }, []);

  const t = useCallback(
    (key: string) => translations[language][key] || translations.en[key] || key,
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);

export const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "si", label: "සිංහල", flag: "🇱🇰" },
  { value: "ta", label: "தமிழ்", flag: "🇱🇰" },
];
