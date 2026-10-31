/* =========================================================
   کمپنی کی معلومات — یہاں تبدیلی کریں تو پوری سائٹ پر بدل جائے گی
   ========================================================= */
export const COMPANY = {
  name: "Signature",
  subtitle: "Catering & Event Management",
  legalName: "Signature Catering & Event Management",
  tagline: "Every Occasion, Our Signature Touch",
  phone: "0321 8255469",
  phoneIntl: "+923218255469",
  whatsapp: "923218255469", // ملک کے کوڈ کے ساتھ، + کے بغیر
  email: "signaturecatering10@gmail.com",
  address: "Pakistan",
  social: {
    facebook: "#",
    instagram: "#",
    youtube: "#",
    tiktok: "#",
  },
};

export const IMG = (id, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=72`;

// وہ شہر جہاں آپ سروس دیتے ہیں — ضرورت کے مطابق بدلیں
export const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Gujranwala", "Sialkot", "Peshawar", "Hyderabad", "Quetta"];

export const TYPES = [
  { id: "barat", label: "Barat", img: "1721324807083-e9ddaa99310e" },
  { id: "walima", label: "Valima", img: "1772127822525-7eda37383b9f" },
  { id: "mehndi", label: "Mehndi & Dholki", img: "1505932794465-147d1f1b2c97" },
  { id: "nikah", label: "Nikah", img: "1542042161784-26ab9e041e89" },
  { id: "catering", label: "Catering", img: "1599487488170-d11ec9c172f0" },
  { id: "decor", label: "Stage & Decor", img: "1780303864944-737d88c789f4" },
  { id: "birthday", label: "Birthday", img: "1530103862676-de8c9debad1d" },
  { id: "corporate", label: "Corporate Events", img: "1540575467063-178a50c2df87" },
];

// Background music — apni (license wali) mp3 file public/music/ folder mein rakhein aur naam yahan likhein.
// File na ho to music button khud chhup jaata hai.
export const BACKGROUND_MUSIC = "/music/background.mp3";

// "Wedding Highlights" — Instagram posts/reels ke links (aur add karne hon to yahan link daal dein)
export const INSTAGRAM_POSTS = [
  {
    url: "https://www.instagram.com/p/DfGP7vasQSx/",
    song: "Shava–Shah Kala",
    artists: "Amaan Ali Bangash, Devika, Ayaan Ali Bangash · Shor Police",
  },
];

// "Our Services" سیکشن کے کارڈز
// Drone — Photographer aur Videographer ke saath add-on
const DRONE_ADDON = {
  icon: "🚁",
  title: "Drone coverage",
  text: "4K aerial photos and video — Barat entry, the full venue from above, fireworks and couple shots in open spaces.",
  points: ["4K drone video & photos", "Licensed, experienced pilot", "Barat entry & venue fly-over", "Cinematic edits for Instagram reels"],
  img: "1532989029401-439615f3d4b4",
};

// har service ka apna page: /services/<slug> — gallery mein Unsplash ki tasveerein (apni asli tasveerein lagana behtar)
export const SERVICES = [
  {
    slug: "event-planner", name: "Event Planner / Coordinator", img: "1513128034602-7814ccaddd4e",
    intro: "One dedicated coordinator who plans your whole event — timelines, vendors, guests and the day itself — so your family can relax and celebrate.",
    includes: ["Event timeline & checklist", "Vendor booking & follow-up", "Guest seating & RSVP", "On-the-day coordination", "Budget planning", "Backup plans for weather & delays"],
    gallery: ["1735415899585-12e3cde91d31", "1513128034602-7814ccaddd4e", "1772127822525-7eda37383b9f", "1688850771088-ea838f3ed5ce", "1768055105012-4c53791b2877", "1773745060497-4cc1df774c72"],
  },
  {
    slug: "decorator", name: "Decorator / Event Designer", img: "1780303864944-737d88c789f4",
    intro: "Floral stages, grand entrances and table décor designed around your theme — from colourful Mehndi setups to elegant Valima stages.",
    includes: ["Bridal stage design", "Fresh & artificial flowers", "Entrance & walkway décor", "Table centrepieces", "Theme & colour planning", "Lighting with décor"],
    gallery: ["1780303864944-737d88c789f4", "1785336872875-0a1657d58eb3", "1773745060497-4cc1df774c72", "1605553426886-c0a99033fda0", "1783314867628-220ab03cac99", "1785336873245-7342c47ff034", "1772127822525-7eda37383b9f", "1785336872942-567382462077"],
  },
  {
    slug: "caterers", name: "Caterers", img: "1606471191009-63994c53433b",
    intro: "Freshly cooked Desi, BBQ, Chinese and Continental menus, served hot with trained staff, live counters and elegant buffet setups.",
    includes: ["Custom menus per head", "Live BBQ, karahi & chaat counters", "Modern buffet with glass-dome display", "Dessert & mithai table", "Uniformed chefs & waiters", "Tasting session before booking"],
    gallery: ["1606471191009-63994c53433b", "1616734755909-bb016ce64930", "1724218012292-5548214cc2d2", "1599487488170-d11ec9c172f0", "1773209927898-a0a7e0a13125", "1776267890245-a54746d62d1a", "1565898094840-7e408a6f361d", "1708782341231-426344114ace"],
  },
  {
    slug: "photographer", name: "Photographer", img: "1747847471528-7b95ea7a4c39",
    intro: "Cinematic bridal portraits and candid moments shot on the latest mirrorless cameras, gimbals and drones — from Nikah to Rukhsati, delivered as an edited album.",
    includes: ["Cinematic bridal & couple portraits", "Latest mirrorless cameras & lighting", "Drone aerial photos (4K)", "Edited high-res online gallery", "Luxury printed album", "Pre-wedding shoot"],
    gallery: ["1747847471528-7b95ea7a4c39", "1707665231481-f0d3e1fceb0b", "1688850771088-ea838f3ed5ce", "1631549423688-6708c88f4672", "1626362729742-d394ea4c6f43", "1634990107998-2c56c5afa573", "1688850771830-fcf551e51ca9", "1521405924368-64c5b84bec60"],
    addons: [DRONE_ADDON],
  },
  {
    slug: "makeup-artist", name: "Makeup Artist", img: "1721324807072-784ab8ddf166",
    intro: "Bridal and party makeup by experienced artists — long-lasting looks for Mehndi, Barat and Valima, with hair styling and dupatta setting.",
    includes: ["Bridal makeup & hair", "Mehndi & party looks", "Dupatta & jewellery setting", "Trial session", "Family & bridesmaid makeup", "Touch-ups during event"],
    gallery: ["1721324807072-784ab8ddf166", "1721324807083-e9ddaa99310e", "1747847471517-952a3eb93a89", "1634990107480-1422c742f9b5", "1707576618343-26a1b377ca7a", "1707665231486-4c1d66a15b80"],
  },
  {
    slug: "videographer", name: "Videographer", img: "1735415899663-484cf50935dd",
    intro: "Cinematic wedding films and highlight reels — with drone coverage and same-day edits for social media.",
    includes: ["Full event coverage", "Cinematic highlight film", "Drone shots", "Instagram reels & teasers", "Same-day edit", "Multi-camera setup"],
    gallery: ["1735415899663-484cf50935dd", "1626362729742-d394ea4c6f43", "1688850771073-f08f838db5f0", "1532989029401-439615f3d4b4", "1644337111604-aa1816b542a1", "1688850771112-57db075cca0c"],
    addons: [DRONE_ADDON],
  },
  {
    slug: "bridal-wear", name: "Bridal Wear", img: "1747847471517-952a3eb93a89",
    intro: "Help choosing and arranging bridal lehengas, shararas and groom wear — with fittings and accessories coordinated for every event.",
    includes: ["Bridal lehenga & sharara", "Groom sherwani", "Jewellery coordination", "Fittings & alterations", "Mehndi & Valima outfits", "Family coordination"],
    gallery: ["1747847471517-952a3eb93a89", "1721324807083-e9ddaa99310e", "1688850771088-ea838f3ed5ce", "1707665231486-4c1d66a15b80", "1634990107480-1422c742f9b5", "1721324807072-784ab8ddf166", "1707576618343-26a1b377ca7a"],
  },
];

export const TYPE_OPTIONS =TYPES.map((t) => ({ value: t.id, label: t.label }));

export const BUDGETS = [
  { value: "0-500000", label: "Under Rs 5 Lakh" },
  { value: "500000-1500000", label: "Rs 5 – 15 Lakh" },
  { value: "1500000-3000000", label: "Rs 15 – 30 Lakh" },
  { value: "3000000-999999999", label: "Rs 30 Lakh +" },
];

export const SLIDES = [
  { tag: "Barat & Valima", title: "Grand Stages, Unforgettable Nights", text: "Floral stages, elegant lighting and seamless hosting for your Barat and Valima.", img: "1773745060497-4cc1df774c72" },
  { tag: "Mehndi", title: "Colourful Mehndi & Dholki Nights", text: "Vibrant décor, swings, dhol and traditional touches your guests will remember.", img: "1505932794465-147d1f1b2c97" },
  { tag: "Catering", title: "Signature Catering", text: "Desi, BBQ and Continental menus — freshly cooked and beautifully served.", img: "1599487488170-d11ec9c172f0" },
  { tag: "Wedding", title: "Your Dream Wedding, Our Signature Touch", text: "From Nikah to Valima, we plan every detail so you can enjoy every moment.", img: "1688850771830-fcf551e51ca9" },
];

/* نمونے کے پیکجز — اپنی اصل قیمتیں اور تفصیل یہاں لکھیں */
export const PACKAGES = [
  { name: "Royal Barat Package", type: "barat", price: 1800000, guests: "Up to 400 guests", tags: ["Bridal Stage", "Catering", "Lighting", "Entry Setup"], img: "1785336872942-567382462077", popular: true },
  { name: "Elegant Valima Package", type: "walima", price: 1500000, guests: "Up to 400 guests", tags: ["Floral Stage", "Catering", "Table Décor"], img: "1780303864944-737d88c789f4", popular: true },
  { name: "Mehndi Night Package", type: "mehndi", price: 800000, guests: "Up to 250 guests", tags: ["Colourful Décor", "Swing", "Dhol", "Dinner"], img: "1505932794465-147d1f1b2c97" },
  { name: "Nikah Ceremony Package", type: "nikah", price: 350000, guests: "Up to 150 guests", tags: ["Nikah Setup", "Hi-Tea", "Floral Décor"], img: "1542042161784-26ab9e041e89" },
  { name: "Complete Shaadi Package", type: "barat", price: 3800000, guests: "Mehndi + Barat + Valima", tags: ["3 Events", "Full Catering", "Décor", "Coordination"], img: "1688850771830-fcf551e51ca9", popular: true },
  { name: "Signature Catering", type: "catering", price: 450000, guests: "Per 300 guests", tags: ["Desi", "BBQ Live Counter", "Continental", "Desserts"], img: "1606471191009-63994c53433b" },
  { name: "Stage & Floral Décor", type: "decor", price: 300000, guests: "Any venue", tags: ["Fresh Flowers", "Stage", "Entrance", "Lighting"], img: "1785336873245-7342c47ff034" },
  { name: "Birthday Celebration", type: "birthday", price: 150000, guests: "Up to 100 guests", tags: ["Theme Décor", "Cake", "Kids Activities"], img: "1530103862676-de8c9debad1d" },
  { name: "Corporate Event Package", type: "corporate", price: 600000, guests: "Up to 300 guests", tags: ["Seminars", "Annual Dinners", "Launches"], img: "1540575467063-178a50c2df87" },
];

/* نمونے کے ریویوز — اپنے اصل کسٹمرز کے ریویوز سے بدلیں */
export const REVIEWS = [
  { name: "Ayesha K.", city: "Lahore", text: "Our Barat stage was absolutely stunning and the food was loved by every guest. Thank you Signature!", event: "Barat" },
  { name: "Usman R.", city: "Islamabad", text: "Very professional team. Our company annual dinner was managed perfectly and on time.", event: "Corporate" },
  { name: "Sana M.", city: "Karachi", text: "The Mehndi décor was so colourful and the dholki night was full of life. Highly recommended.", event: "Mehndi" },
];

export const FAQS = [
  { q: "Which cities do you serve?", a: "We manage events in major cities across Pakistan. Call or WhatsApp us with your city and date to confirm availability." },
  { q: "Do you provide catering only, or full event management?", a: "Both. You can book catering only, décor only, or a complete package with stage, lighting, catering and coordination." },
  { q: "Can I customise a package?", a: "Yes. Every package can be customised to your guest count, menu, theme and budget." },
  { q: "How far in advance should I book?", a: "For weddings we recommend booking 1–3 months in advance, especially in the wedding season. Smaller events can be arranged sooner." },
  { q: "How do I get a quote?", a: "Click 'Get a Quote', fill in your details, or simply call / WhatsApp us on " + COMPANY.phone + "." },
];

// "19:00" → "7:00 PM"
const time12 = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
export const timingText = (start, end) =>
  start && end ? `${time12(start)} – ${time12(end)}` : start ? `From ${time12(start)}` : end ? `Until ${time12(end)}` : "";

export const typeLabel =(id) => TYPES.find((t) => t.id === id)?.label || id;

export const formatPKR = (n) =>
  n >= 100000 ? `Rs ${(n / 100000).toFixed(n % 100000 ? 1 : 0)} Lakh` : `Rs ${n.toLocaleString("en-PK")}`;
