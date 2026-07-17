import Link from "next/link";
import { HeartPulse, Shield, Calendar, MessageCircle, ShoppingBag, MapPin, Stethoscope, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>

      {/* ── NAVBAR ── */}
      <nav style={{ background: "rgba(240,250,248,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #c9ebe4" }}
        className="flex items-center justify-between px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }} className="p-2 rounded-xl">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <h1 style={{ color: "#0f4c3a", fontWeight: 800, letterSpacing: "-0.5px" }} className="text-xl">MedAssist</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/signIn"
            style={{ color: "#0d9488", fontWeight: 600 }}
            className="px-5 py-2 rounded-full text-sm hover:opacity-80 transition-opacity">
            Sign In
          </Link>
          <Link href="/signUp"
            style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)", color: "white", fontWeight: 600 }}
            className="px-5 py-2 rounded-full text-sm hover:opacity-90 transition-opacity shadow-md">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
        {/* decorative blobs */}
        <div style={{ background: "radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)" }}
          className="absolute top-10 left-10 w-96 h-96 rounded-full pointer-events-none" />
        <div style={{ background: "radial-gradient(circle, rgba(251,113,133,0.12) 0%, transparent 70%)" }}
          className="absolute bottom-10 right-10 w-80 h-80 rounded-full pointer-events-none" />

        <span style={{ background: "linear-gradient(135deg, #ccfbf1, #cffafe)", color: "#0d9488", fontWeight: 700, letterSpacing: "2px" }}
          className="text-xs px-4 py-1.5 rounded-full mb-8 uppercase border border-teal-200">
          ✦ Your Personal Health Platform
        </span>

        <h1 style={{ color: "#0f4c3a", lineHeight: 1.1, fontWeight: 800 }}
          className="text-6xl mb-6 max-w-3xl tracking-tight">
          Healthcare that{" "}
          <span style={{
            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            feels human
          </span>
        </h1>

        <p style={{ color: "#4a7c6f" }} className="text-lg max-w-xl mb-12 leading-relaxed">
          AI-powered health guidance, verified doctors, medicine delivery and nearby clinic finder — all in one place.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/signUp"
            style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)", color: "white", fontWeight: 700 }}
            className="px-8 py-3.5 rounded-full text-sm hover:opacity-90 transition-all hover:scale-105 shadow-lg">
            Start for Free →
          </Link>
          <Link href="/signIn"
            style={{ border: "2px solid #0d9488", color: "#0d9488", fontWeight: 700, background: "white" }}
            className="px-8 py-3.5 rounded-full text-sm hover:opacity-80 transition-all">
            Sign In
          </Link>
        </div>

        {/* floating stat pills */}
        <div className="flex gap-4 mt-16 flex-wrap justify-center">
          {[
            { label: "AI Powered", color: "#ccfbf1", text: "#0d9488" },
            { label: "24/7 Available", color: "#fce7f3", text: "#db2777" },
            { label: "Verified Doctors", color: "#e0f2fe", text: "#0284c7" },
          ].map((pill) => (
            <span key={pill.label}
              style={{ background: pill.color, color: pill.text, fontWeight: 600 }}
              className="px-4 py-2 rounded-full text-sm border border-white shadow-sm">
              {pill.label}
            </span>
          ))}
        </div>
      </main>

      {/* ── FEATURES SECTION ── */}
      <section className="px-8 py-20" style={{ background: "white" }}>
        <div className="max-w-6xl mx-auto">
          <h2 style={{ color: "#0f4c3a", fontWeight: 800 }} className="text-3xl text-center mb-2">Everything you need</h2>
          <p style={{ color: "#4a7c6f" }} className="text-center mb-12">One platform for all your health needs</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: HeartPulse, title: "AI Health Guidance", desc: "Describe symptoms and get instant AI-powered health insights available 24/7.", grad: "linear-gradient(135deg, #0d9488, #06b6d4)", light: "#ccfbf1" },
              { icon: Calendar, title: "Book Appointment", desc: "Schedule with verified specialists at your preferred time and location.", grad: "linear-gradient(135deg, #7c3aed, #a78bfa)", light: "#ede9fe" },
              { icon: Stethoscope, title: "Chat with Doctor", desc: "Connect with verified medical practitioners for real-time consultation.", grad: "linear-gradient(135deg, #0284c7, #38bdf8)", light: "#e0f2fe" },
              { icon: MapPin, title: "Find Nearby", desc: "Search for nearby medical stores, clinics and specialists with Maps.", grad: "linear-gradient(135deg, #f97316, #fb923c)", light: "#ffedd5" },
              { icon: ShoppingBag, title: "Buy Medicines", desc: "Order prescribed medicines online and get them delivered to your door.", grad: "linear-gradient(135deg, #db2777, #f472b6)", light: "#fce7f3" },
              { icon: Shield, title: "Private & Secure", desc: "Your health data is fully encrypted and protected. Privacy first.", grad: "linear-gradient(135deg, #059669, #34d399)", light: "#d1fae5" },
            ].map(({ icon: Icon, title, desc, grad, light }) => (
              <div key={title}
                style={{ border: "1px solid #e5f3ef" }}
                className="flex flex-col p-6 bg-white rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 cursor-default">
                <div style={{ background: light }} className="p-3 rounded-xl w-fit mb-4">
                  <div style={{ background: grad }} className="p-2 rounded-lg">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg mb-2">{title}</h3>
                <p style={{ color: "#4a7c6f" }} className="text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #c9ebe4", color: "#4a7c6f" }} className="text-center py-8 text-sm">
        © 2026 MedAssist. All rights reserved.
      </footer>

    </div>
  );
}