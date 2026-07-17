'use client'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User } from 'next-auth';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
    HeartPulse, 
    CalendarDays, 
    MessageCircle, 
    Stethoscope,
    ChevronRight,
    ClipboardList
} from 'lucide-react';

const page = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    // redirect new users to info page
    useEffect(() => {
        if (status === "authenticated" && session?.user?.isNewUser === true) {
            router.replace("/info");
        }
    }, [session, status]);

    if (status === "loading") {
        return (
            <div className="flex justify-center items-center min-h-screen" style={{ background: "#f0faf8" }}>
                <div style={{ color: "#0d9488" }} className="animate-pulse">Loading...</div>
            </div>
        )
    }

    if (!session || !session.user) {
        return <div>Please Login</div>
    }

    const { username } = session?.user as User;

    return (
        <div className="min-h-screen" style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* ── WELCOME SECTION ── */}
                <div className="mb-10 relative">
                    <div style={{ background: "radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%)" }}
                        className="absolute -top-10 -left-10 w-72 h-72 rounded-full pointer-events-none" />
                    <h1 style={{ color: "#0f4c3a", fontWeight: 800, lineHeight: 1.2 }} className="text-4xl mb-1 relative">
                        Welcome back,{" "}
                        <span style={{
                            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            {username}
                        </span>{" "}👋
                    </h1>
                    <p style={{ color: "#4a7c6f" }} className="text-base">
                        How are you feeling today? Let's take care of your health.
                    </p>
                </div>

                <Separator className="mb-10" style={{ background: "#c9ebe4" }} />

                {/* ── CHATBOT CTA SECTION ── */}
                <div style={{ background: "linear-gradient(135deg, #0f4c3a, #0d9488)", borderRadius: "20px" }}
                    className="p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                    {/* decorative circle */}
                    <div style={{ background: "rgba(255,255,255,0.05)", width: 200, height: 200, borderRadius: "50%", position: "absolute", right: -40, top: -40 }} />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <HeartPulse className="h-6 w-6" style={{ color: "#5eead4" }} />
                            <span style={{ color: "#5eead4", fontWeight: 600 }} className="text-lg">AI Health Assistant</span>
                        </div>
                        <h2 className="text-white text-2xl font-bold mb-2">
                            Not feeling well? Talk to MedAssist
                        </h2>
                        <p style={{ color: "#99f6e4" }} className="text-sm max-w-md">
                            Describe your symptoms and get instant AI-powered health guidance.
                            Available 24/7 just for you.
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

                {/* ── QUICK ACTIONS GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

                    {/* Book Appointment Card */}
                    <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                        className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div style={{ background: "#ede9fe" }} className="p-3 rounded-xl">
                                <div style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }} className="p-2 rounded-lg">
                                    <CalendarDays className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 style={{ color: "#0f4c3a", fontWeight: 700 }} className="font-semibold">Book Appointment</h3>
                                <p style={{ color: "#4a7c6f" }} className="text-xs">Schedule with a specialist</p>
                            </div>
                        </div>
                        <p style={{ color: "#4a7c6f" }} className="text-sm mb-4">
                            Find and book appointments with verified doctors near you.
                            Choose your preferred time slot.
                        </p>
                        {/* redirect to appointment page (to be designed) */}
                        <button
                            onClick={() => router.push("/appointment")}
                            style={{ border: "1.5px solid #7c3aed", color: "#7c3aed", fontWeight: 600, background: "white" }}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm hover:opacity-80 transition-opacity">
                            Book Now
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Chat with Doctor Card */}
                    <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                        className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div style={{ background: "#e0f2fe" }} className="p-3 rounded-xl">
                                <div style={{ background: "linear-gradient(135deg, #0284c7, #38bdf8)" }} className="p-2 rounded-lg">
                                    <Stethoscope className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 style={{ color: "#0f4c3a", fontWeight: 700 }} className="font-semibold">Chat with a Doctor</h3>
                                <p style={{ color: "#4a7c6f" }} className="text-xs">Verified medical practitioners</p>
                            </div>
                        </div>
                        <p style={{ color: "#4a7c6f" }} className="text-sm mb-4">
                            Connect instantly with verified medical practitioners
                            for real-time consultation and advice.
                        </p>
                        {/* redirect to doctor chat page (to be designed) */}
                        <button
                            onClick={() => router.push("/doctor-chat")}
                            style={{ border: "1.5px solid #0284c7", color: "#0284c7", fontWeight: 600, background: "white" }}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm hover:opacity-80 transition-opacity">
                            Chat Now
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ── PAST ENQUIRIES SECTION ── */}
                <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                    className="rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div style={{ background: "#ccfbf1" }} className="p-3 rounded-xl">
                                <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }} className="p-2 rounded-lg">
                                    <ClipboardList className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg">Past Health Enquiries</h3>
                                <p style={{ color: "#4a7c6f" }} className="text-xs">Your previous chat summaries</p>
                            </div>
                        </div>
                        {/* redirect to chatbot for full history */}
                        <button
                            onClick={() => router.push("/chatbot")}
                            style={{ color: "#0d9488", fontWeight: 600 }}
                            className="text-sm flex items-center gap-1 hover:opacity-80 transition-opacity">
                            View All
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* placeholder for past enquiries list */}
                    {/* TODO: fetch and display actual chat summaries here */}
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div style={{ background: "#ccfbf1" }} className="p-4 rounded-full mb-4">
                            <MessageCircle className="h-10 w-10" style={{ color: "#0d9488" }} />
                        </div>
                        <p style={{ color: "#4a7c6f" }} className="text-sm font-medium">No health enquiries yet.</p>
                        <p style={{ color: "#4a7c6f" }} className="text-xs mt-1 opacity-70">
                            Start a chat with MedAssist to get health guidance.
                        </p>
                        <button
                            onClick={() => router.push("/chatbot")}
                            style={{ border: "1.5px solid #0d9488", color: "#0d9488", fontWeight: 600, background: "white" }}
                            className="mt-4 text-sm px-6 py-2.5 rounded-xl hover:opacity-80 transition-opacity flex items-center gap-2">
                            <HeartPulse className="h-4 w-4" />
                            Start Your First Chat
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default page;