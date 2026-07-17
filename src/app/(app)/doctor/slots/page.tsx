'use client'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/src/types/ApiResponse';
import { HeartPulse, Clock, ChevronLeft, Loader2, Plus, Trash2 } from 'lucide-react';

interface Slot {
    _id: string
    day: string
    from: string
    to: string
    status: "available" | "booked"
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DoctorSlotsPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [slots, setSlots] = useState<Slot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingSlot, setIsAddingSlot] = useState(false);
    const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
    const [newSlot, setNewSlot] = useState({ day: "Monday", from: "", to: "" });
    const [activeFilter, setActiveFilter] = useState<"all" | "available" | "booked">("all");

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/signIn");
        if (status === "authenticated" && session?.user?.role !== "doctor") {
            router.replace("/Home");
        }
    }, [status, session]);

    useEffect(() => {
        if (status === "authenticated") fetchSlots();
    }, [status]);

    if (status === "loading") return (
        <div className="flex justify-center items-center min-h-screen" style={{ background: "#f0faf8" }}>
            <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
        </div>
    )
    if (!session) return null;

    const fetchSlots = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/slots/list');
            if (response.data.success) {
                setSlots(response.data.slots);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to fetch slots.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleAddSlot = async () => {
        if (!newSlot.from || !newSlot.to) {
            toast.error("Please select both from and to time.");
            return;
        }
        if (newSlot.from >= newSlot.to) {
            toast.error("From time must be before to time.");
            return;
        }
        setIsAddingSlot(true);
        try {
            const response = await axios.post('/api/slots/add', {
                day: newSlot.day,
                from: newSlot.from,
                to: newSlot.to,
            });
            if (response.data.success) {
                toast.success(response.data.message);
                setNewSlot({ day: "Monday", from: "", to: "" });
                await fetchSlots();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to add slot.");
        } finally {
            setIsAddingSlot(false);
        }
    }

    const handleDeleteSlot = async (slotId: string) => {
        setDeletingSlotId(slotId);
        try {
            const response = await axios.delete(`/api/slots/remove?slotId=${slotId}`);
            if (response.data.success) {
                toast.success(response.data.message);
                setSlots(prev => prev.filter(s => s._id !== slotId));
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to delete slot.");
        } finally {
            setDeletingSlotId(null);
        }
    }

    const filteredSlots = activeFilter === "all"
        ? slots
        : slots.filter(s => s.status === activeFilter);

    const availableCount = slots.filter(s => s.status === "available").length;
    const bookedCount = slots.filter(s => s.status === "booked").length;

    return (
        <div className="min-h-screen" style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>
            <div className="max-w-4xl mx-auto px-6 py-10">

                {/* ── HEADER ── */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push("/doctor/dashboard")}
                        style={{ color: "#0d9488", fontWeight: 600 }}
                        className="flex items-center gap-1 text-sm mb-4 hover:opacity-80">
                        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3 mb-1">
                        <div style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }} className="p-2 rounded-xl">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        <h1 style={{ color: "#0f4c3a", fontWeight: 800 }} className="text-4xl">
                            My Slots
                        </h1>
                    </div>
                    <p style={{ color: "#4a7c6f" }}>
                        {availableCount} available · {bookedCount} booked
                    </p>
                </div>

                {/* ── ADD NEW SLOT FORM ── */}
                <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                    className="rounded-2xl p-6 shadow-sm mb-6">
                    <h2 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg mb-4">
                        Add New Availability Slot
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label style={{ color: "#4a7c6f", fontWeight: 600 }} className="text-xs mb-1 block">Day</label>
                            <select
                                value={newSlot.day}
                                onChange={(e) => setNewSlot(prev => ({ ...prev, day: e.target.value }))}
                                style={{ border: "1px solid #c9ebe4", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#0f4c3a", background: "white", width: "100%" }}>
                                {days.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: "#4a7c6f", fontWeight: 600 }} className="text-xs mb-1 block">From</label>
                            <input
                                type="time"
                                value={newSlot.from}
                                onChange={(e) => setNewSlot(prev => ({ ...prev, from: e.target.value }))}
                                style={{ border: "1px solid #c9ebe4", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#0f4c3a", background: "white", width: "100%" }}
                            />
                        </div>
                        <div>
                            <label style={{ color: "#4a7c6f", fontWeight: 600 }} className="text-xs mb-1 block">To</label>
                            <input
                                type="time"
                                value={newSlot.to}
                                onChange={(e) => setNewSlot(prev => ({ ...prev, to: e.target.value }))}
                                style={{ border: "1px solid #c9ebe4", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#0f4c3a", background: "white", width: "100%" }}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleAddSlot}
                        disabled={isAddingSlot}
                        style={{
                            background: isAddingSlot ? "#c9ebe4" : "linear-gradient(135deg, #7c3aed, #a78bfa)",
                            color: "white",
                            fontWeight: 700,
                            padding: "12px 24px",
                            borderRadius: 12,
                            border: "none",
                            cursor: isAddingSlot ? "not-allowed" : "pointer"
                        }}
                        className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        {isAddingSlot
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
                            : <><Plus className="h-4 w-4" /> Add Slot</>
                        }
                    </button>
                </div>

                {/* ── FILTER TABS ── */}
                <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                    className="rounded-2xl p-2 mb-6 flex gap-2 shadow-sm">
                    {(["all", "available", "booked"] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            style={{
                                background: activeFilter === filter
                                    ? "linear-gradient(135deg, #7c3aed, #a78bfa)"
                                    : "transparent",
                                color: activeFilter === filter ? "white" : "#4a7c6f",
                                fontWeight: 600
                            }}
                            className="flex-1 py-2 rounded-xl text-sm capitalize transition-all">
                            {filter} ({filter === "all" ? slots.length : filter === "available" ? availableCount : bookedCount})
                        </button>
                    ))}
                </div>

                {/* ── SLOTS LIST ── */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin h-8 w-8" style={{ color: "#0d9488" }} />
                    </div>
                ) : filteredSlots.length === 0 ? (
                    <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                        className="rounded-2xl p-16 text-center shadow-sm">
                        <Clock className="h-16 w-16 mx-auto mb-4" style={{ color: "#c9ebe4" }} />
                        <p style={{ color: "#4a7c6f" }} className="text-lg">No slots found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredSlots.map(slot => (
                            <div key={slot._id}
                                style={{
                                    background: "white",
                                    border: `1px solid ${slot.status === "booked" ? "#fed7aa" : "#c9ebe4"}`
                                }}
                                className="rounded-2xl p-5 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* day pill */}
                                    <div style={{
                                        background: slot.status === "available"
                                            ? "linear-gradient(135deg, #7c3aed, #a78bfa)"
                                            : "linear-gradient(135deg, #f97316, #fb923c)",
                                        minWidth: 80
                                    }} className="px-3 py-2 rounded-xl text-center">
                                        <span className="text-white font-bold text-xs">{slot.day}</span>
                                    </div>
                                    <div>
                                        <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-base">
                                            {slot.from} — {slot.to}
                                        </p>
                                        <span style={{
                                            background: slot.status === "available" ? "#d1fae5" : "#ffedd5",
                                            color: slot.status === "available" ? "#059669" : "#f97316",
                                            fontWeight: 600
                                        }} className="text-xs px-2 py-0.5 rounded-full">
                                            {slot.status}
                                        </span>
                                    </div>
                                </div>

                                {/* delete — only available slots */}
                                {slot.status === "available" && (
                                    <button
                                        onClick={() => handleDeleteSlot(slot._id)}
                                        disabled={deletingSlotId === slot._id}
                                        style={{ background: "#fee2e2", color: "#dc2626" }}
                                        className="p-2.5 rounded-xl hover:opacity-80 transition-opacity">
                                        {deletingSlotId === slot._id
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Trash2 className="h-4 w-4" />
                                        }
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DoctorSlotsPage;