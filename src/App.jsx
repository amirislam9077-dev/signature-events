import { useCallback, useEffect, useRef, useState } from "react";
import { COMPANY, timingText, typeLabel } from "./data";
import { postJSON } from "./api";
import Header from "./components/Header";
import Hero from "./components/Hero";
import BlogCarousel from "./components/BlogCarousel";
import About from "./components/About";
import Highlights from "./components/Highlights";
import Services from "./components/Services";
import Categories from "./components/Categories";
import Packages from "./components/Packages";
import HowItWorks from "./components/HowItWorks";
import Invitations from "./components/Invitations";
import Reviews from "./components/Reviews";
import Faq from "./components/Faq";
import VendorCta from "./components/VendorCta";
import Footer from "./components/Footer";
import { QuoteModal, VendorModal } from "./components/Modals";
import Toast from "./components/Toast";
import BackToAdmin from "./components/BackToAdmin";
import MusicPlayer from "./components/MusicPlayer";

const EMPTY_FILTERS = { city: "", date: "", startTime: "", endTime: "", types: [], budget: "" };

export default function App() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [quoteFor, setQuoteFor] = useState(null);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.title = `${COMPANY.name} | ${COMPANY.subtitle} in Pakistan`;
  }, []);

  const scrollToPackages = () => document.getElementById("packages")?.scrollIntoView();

  const [planOpen, setPlanOpen] = useState(false);
  const closePlan = useCallback(() => setPlanOpen(false), []);

  const handleSearch = (next, callback) => {
    setFilters(next);
    // سرچ کا ریکارڈ ڈیٹابیس میں؛ ناکام ہو تو بھی صارف کو نہیں روکتے
    postJSON("/api/searches", { ...next, callback }).catch(() => {});
    if (callback) setQuoteFor("a free call back");
    else scrollToPackages();
  };

  const pickType = (type) => {
    setFilters((f) => ({
      ...f,
      types: f.types.includes(type) ? f.types.filter((t) => t !== type) : [...f.types, type],
    }));
    scrollToPackages();
  };

  // chip کی key: "city", "date", "budget", "all" یا "type:barat"
  const clearFilter = (key) => {
    if (key === "all") setFilters(EMPTY_FILTERS);
    else if (key.startsWith("type:")) {
      const id = key.slice(5);
      setFilters((f) => ({ ...f, types: f.types.filter((t) => t !== id) }));
    } else if (key === "time") setFilters((f) => ({ ...f, startTime: "", endTime: "" }));
    else setFilters((f) => ({ ...f, [key]: "" }));
  };

  const showToast = (message, action = null) => {
    clearTimeout(toastTimer.current);
    setToast({ message, action });
    toastTimer.current = setTimeout(() => setToast(null), action ? 12000 : 3500);
  };
  const hideToast = () => setToast(null);

  const showSendError = () =>
    showToast(`Sorry, could not send right now. Please call or WhatsApp us on ${COMPANY.phone}.`);

  // کامیابی کے بعد: کسٹمر ایک کلک میں تفصیل ہمارے WhatsApp پر بھی بھیج سکے
  const enquirySent = (data, id) => {
    const events = data.types.map(typeLabel).join(", ") || "-";
    const text = [
      `Assalam o Alaikum Signature! 👋`,
      `Enquiry #${id}`,
      `Name: ${data.name}`,
      `WhatsApp: ${data.phone}`,
      `City: ${data.city}`,
      `Event(s): ${events}`,
      `Date: ${data.date}`,
      timingText(data.startTime, data.endTime) && `Timing: ${timingText(data.startTime, data.endTime)}`,
      data.guests && `Guests: ${data.guests}`,
      data.message && `Details: ${data.message}`,
    ].filter(Boolean).join("\n");
    const note = data.email ? " A confirmation email is on its way." : "";
    showToast(`Thank you! Your enquiry #${id} is received.${note}`, {
      label: "Also send on WhatsApp",
      href: `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`,
    });
  };

  const vendorSent = (data, id) => {
    const text = `Assalam o Alaikum Signature! Vendor registration #${id}\nBusiness: ${data.business}\nName: ${data.name}\nMobile: ${data.phone}\nCity: ${data.city}\nService: ${typeLabel(data.type)}`;
    showToast("Thanks for registering! Our team will call you soon.", {
      label: "Also send on WhatsApp",
      href: `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`,
    });
  };

  return (
    <>
      <Header onQuote={() => setQuoteFor("your event")} onJoin={() => setVendorOpen(true)} onPlan={() => setPlanOpen(true)} />
      <main>
        <Hero filters={filters} onSearch={handleSearch} planOpen={planOpen} onPlanOpen={() => setPlanOpen(true)} onPlanClose={closePlan} />
        <BlogCarousel />
        <About onQuote={() => setQuoteFor("your event")} />
        <Services city={filters.city} onQuote={setQuoteFor} />
        <Categories active={filters.types} onPick={pickType} />
        <Packages filters={filters} onClear={clearFilter} onQuote={setQuoteFor} />
        <Highlights />
        <HowItWorks />
        <Invitations />
        <Reviews />
        <Faq />
        <VendorCta onQuote={() => setQuoteFor("your event")} onJoin={() => setVendorOpen(true)} />
      </main>
      <Footer />

      <QuoteModal
        open={!!quoteFor}
        forWhom={quoteFor}
        filters={filters}
        onClose={() => setQuoteFor(null)}
        onSubmit={enquirySent}
        onError={showSendError}
      />
      <VendorModal
        open={vendorOpen}
        onClose={() => setVendorOpen(false)}
        onSubmit={vendorSent}
        onError={showSendError}
      />
      <Toast message={toast?.message} action={toast?.action} onClose={hideToast} />
      <BackToAdmin />
      <MusicPlayer />
    </>
  );
}
