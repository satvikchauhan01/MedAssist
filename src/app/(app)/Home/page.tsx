'use client'
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from 'next-auth';
import {
    HeartPulse, CalendarDays, Stethoscope,
    MapPin, ShoppingBag, ChevronRight,
    LogOut, Search, Loader2, LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── LOGGED-IN HOMEPAGE ──
const HomePage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    // redirect new users to info page
    useEffect(() => {
        if (status === "authenticated" && session?.user?.isNewUser === true) {
            router.replace("/info");
        }
        if (status === "unauthenticated") {
            router.replace("/signIn");
        }
    }, [session, status]);

    if (status === "loading") return (
        <div className="flex justify-center items-center min-h-screen" style={{ background: "#f0faf8" }}>
            <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
        </div>
    )

    if (!session || !session.user) return null;

    const { username } = session?.user as User;

    // ── SEARCH HANDLER ──
    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        router.push(`/nearby?q=${encodeURIComponent(searchQuery)}`);
    }

    // feature cards data
    const features = [
        {
            icon: CalendarDays,
            title: "Book Appointment",
            desc: "Schedule with a verified specialist at your preferred time.",
            cta: "Book Now",
            route: "/appointment",
            grad: "linear-gradient(135deg, #7c3aed, #a78bfa)",
            light: "#ede9fe",
            accent: "#7c3aed"
        },
        {
            icon: Stethoscope,
            title: "Chat with a Doctor",
            desc: "Connect with verified medical practitioners for real-time consultation.",
            cta: "Chat Now",
            route: "/doctor-chat",
            grad: "linear-gradient(135deg, #0284c7, #38bdf8)",
            light: "#e0f2fe",
            accent: "#0284c7"
        },
        {
            icon: ShoppingBag,
            title: "Buy Medicines",
            desc: "Order prescribed medicines online with fast home delivery.",
            cta: "Shop Now",
            route: "/medicines",
            grad: "linear-gradient(135deg, #db2777, #f472b6)",
            light: "#fce7f3",
            accent: "#db2777"
        },
    ];

    return (
        <div className="min-h-screen" style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>

            {/* ── NAVBAR ── */}
            <nav style={{ background: "rgba(240,250,248,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #c9ebe4" }}
                className="px-8 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }} className="p-2 rounded-xl">
                        <HeartPulse className="h-5 w-5 text-white" />
                    </div>
                    <h1 style={{ color: "#0f4c3a", fontWeight: 800 }} className="text-xl tracking-tight">MedAssist</h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* welcome username */}
                    <span style={{ color: "#4a7c6f" }} className="text-sm hidden md:block">
                        Welcome, <span style={{ color: "#0f4c3a", fontWeight: 700 }}>{username}</span>
                    </span>
                    {/* logout button */}
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        style={{ border: "1.5px solid #0d9488", color: "#0d9488", fontWeight: 600, background: "white" }}
                        className="flex items-center gap-2 text-sm px-4 py-2 rounded-full hover:opacity-80 transition-opacity">
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* ── HERO GREETING ── */}
                <div className="mb-10 relative">
                    <div style={{ background: "radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%)" }}
                        className="absolute -top-10 -left-10 w-72 h-72 rounded-full pointer-events-none" />
                    <h1 style={{ color: "#0f4c3a", fontWeight: 800, lineHeight: 1.2 }} className="text-4xl mb-2 relative">
                        Hello, <span style={{
                            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>{username}</span> 👋
                    </h1>
                    <p style={{ color: "#4a7c6f" }}>How can we help you today?</p>
                </div>

                {/* ── SEARCH BAR ── */}
                {/* search for nearby doctors, clinics, medical stores */}
                <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                    className="rounded-2xl p-6 mb-8 shadow-sm">
                    <h2 style={{ color: "#0f4c3a", fontWeight: 700 }} className="mb-1 flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5" style={{ color: "#0d9488" }} />
                        Find Nearby
                    </h2>
                    <p style={{ color: "#4a7c6f" }} className="text-sm mb-4">
                        Search for doctors, clinics, or medical stores near you
                    </p>
                    <div className="flex gap-3">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Search doctors, clinics, medical stores..."
                            style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
                            className="flex-1 focus:ring-teal-400"
                        />
                        <button
                            onClick={handleSearch}
                            style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)", color: "white", fontWeight: 600 }}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-md text-sm">
                            <Search className="h-4 w-4" />
                            Search
                        </button>
                    </div>
                </div>

                {/* ── AI CHATBOT CTA ── */}
                {/* big CTA to start AI health chat */}
                <div style={{ background: "linear-gradient(135deg, #0f4c3a, #0d9488)", borderRadius: "20px" }}
                    className="p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                    {/* decorative circle */}
                    <div style={{ background: "rgba(255,255,255,0.05)", width: 200, height: 200, borderRadius: "50%", position: "absolute", right: -40, top: -40 }} />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <HeartPulse className="h-5 w-5" style={{ color: "#5eead4" }} />
                            <span style={{ color: "#5eead4", fontWeight: 600 }} className="text-sm">AI Health Assistant</span>
                        </div>
                        <h2 className="text-white text-2xl font-bold mb-2">Not feeling well?</h2>
                        <p style={{ color: "#99f6e4" }} className="text-sm max-w-md">
                            Describe your symptoms and get instant AI-powered health guidance, available 24/7.
                        </p>
                    </div>
                    {/* redirect to chatbot */}
                    <button
                        onClick={() => router.push("/chatbot")}
                        style={{ background: "white", color: "#0d9488", fontWeight: 700 }}
                        className="flex items-center gap-2 px-8 py-4 rounded-xl text-base hover:opacity-90 transition-all shadow-lg whitespace-nowrap relative z-10 hover:scale-105">
                        <HeartPulse className="h-5 w-5" />
                        Check Your Health
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* ── FEATURES GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {features.map(({ icon: Icon, title, desc, cta, route, grad, light, accent }) => (
                        <div
                            key={title}
                            onClick={() => router.push(route)}
                            style={{ background: "white", border: "1px solid #c9ebe4" }}
                            className="rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 group">
                            <div style={{ background: light }} className="p-3 rounded-xl w-fit mb-4">
                                <div style={{ background: grad }} className="p-2 rounded-lg">
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <h3 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg mb-1">{title}</h3>
                            <p style={{ color: "#4a7c6f" }} className="text-sm mb-4 leading-relaxed">{desc}</p>
                            <div style={{ color: accent }} className="flex items-center text-sm font-semibold group-hover:gap-2 transition-all gap-1">
                                {cta} <ChevronRight className="h-4 w-4" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── MY DASHBOARD LINK ── */}
                {/* link to detailed patient dashboard */}
                <div
                    onClick={() => router.push("/dashboard")}
                    style={{ background: "white", border: "1px solid #c9ebe4" }}
                    className="rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div style={{ background: "#ccfbf1" }} className="p-3 rounded-xl">
                            <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }} className="p-2 rounded-lg">
                                <LayoutDashboard className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h3 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg mb-1">My Health Dashboard</h3>
                            <p style={{ color: "#4a7c6f" }} className="text-sm">View your health history, past enquiries and more.</p>
                        </div>
                    </div>
                    <ChevronRight className="h-6 w-6" style={{ color: "#0d9488" }} />
                </div>

            </div>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: "1px solid #c9ebe4", color: "#4a7c6f" }} className="text-center py-6 text-sm mt-10">
                © 2026 MedAssist. All rights reserved.
            </footer>

        </div>
    )
}

export default HomePage;