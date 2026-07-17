'use client'
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from 'next-auth';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/src/types/ApiResponse';
import {
    HeartPulse, LogOut, Calendar, Users, Clock,
    MessageCircle, Video, Plus, Trash2, CheckCircle,
    Bell, ChevronRight, Stethoscope, Activity, Loader2
} from 'lucide-react';

// ── TYPES ──
interface Slot {
    _id: string
    day: string
    from: string
    to: string
    status: "available" | "booked"
}

interface Appointment {
    _id: string
    patientId: { _id: string; name: string; age: number; gender: string }
    slotId: { _id: string; day: string; from: string; to: string }
    date: string
    timeSlot: string
    typeOfAppointment: "video" | "chat"
    status: "pending" | "confirmed" | "completed" | "cancelled"
}

interface Notification {
    _id: string
    text: string
    type: string
    isRead: boolean
    createdAt: string
}

interface PastPatient {
    patientId: string
    name: string
    age: number
    lastInteraction: string
    interactions: number
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DoctorDashboard = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    // ── STATE ──
    const [slots, setSlots] = useState<Slot[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [pastPatients, setPastPatients] = useState<PastPatient[]>([]);
    const [newSlot, setNewSlot] = useState({ day: "Monday", from: "", to: "" });
    const [isOnline, setIsOnline] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");

    // loading states
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [isLoadingPastPatients, setIsLoadingPastPatients] = useState(false);
    const [isAddingSlot, setIsAddingSlot] = useState(false);
    const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
    const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);

    // auth + role protection
    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/signIn");
        }
        if (status === "authenticated" && session?.user?.isNewUser) {
            router.replace("/info");
        }
    }, [status, session]);

    // fetch all data on load
    useEffect(() => {
        if (status === "authenticated") {
            fetchSlots();
            fetchAppointments();
            fetchNotifications();
            fetchPastPatients();
        }
    }, [status]);

    if (status === "loading") return (
        <div className="flex justify-center items-center min-h-screen" style={{ background: "#f0faf8" }}>
            <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
        </div>
    )

    if (!session || !session.user) return null;

    const { username, specialization } = session.user as User;

    // ── FETCH SLOTS FROM DB ──
    const fetchSlots = async () => {
        setIsLoadingSlots(true);
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
            setIsLoadingSlots(false);
        }
    }

    // ── FETCH APPOINTMENTS FROM DB ──
    const fetchAppointments = async () => {
        setIsLoadingAppointments(true);
        try {
            const response = await axios.get('/api/appointments/doctor-list');
            if (response.data.success) {
                setAppointments(response.data.appointments);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to fetch appointments.");
        } finally {
            setIsLoadingAppointments(false);
        }
    }

    // ── FETCH NOTIFICATIONS ──
    const fetchNotifications = async () => {
        setIsLoadingNotifications(true);
        try {
            const response = await axios.get('/api/notifications/list');
            if (response.data.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            console.error("Failed to fetch notifications");
        } finally {
            setIsLoadingNotifications(false);
        }
    }

    // ── FETCH PAST PATIENTS ──
    const fetchPastPatients = async () => {
        setIsLoadingPastPatients(true);
        try {
            const response = await axios.get('/api/appointments/past-patients');
            if (response.data.success) {
                setPastPatients(response.data.pastPatients);
            }
        } catch (error) {
            console.error("Failed to fetch past patients");
        } finally {
            setIsLoadingPastPatients(false);
        }
    }

    // ── MARK NOTIFICATIONS READ ──
    const handleNotificationsBell = async () => {
        setShowNotifications(!showNotifications);
        if (!showNotifications && notifications.some(n => !n.isRead)) {
            try {
                await axios.put('/api/notifications/mark-read');
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (error) {
                console.error("Failed to mark notifications as read");
            }
        }
    }

    // ── ADD SLOT ──
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

    // ── DELETE SLOT ──
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

    // ── UPDATE APPOINTMENT STATUS ──
    const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
        setUpdatingAppointmentId(appointmentId);
        try {
            const response = await axios.put('/api/appointments/update-status', {
                appointmentId,
                status: newStatus,
            });
            if (response.data.success) {
                toast.success(response.data.message);
                setAppointments(prev =>
                    prev.map(apt =>
                        apt._id === appointmentId
                            ? { ...apt, status: newStatus as Appointment["status"] }
                            : apt
                    )
                );
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to update appointment.");
        } finally {
            setUpdatingAppointmentId(null);
        }
    }

    // ── CALCULATE STATS FROM REAL DATA ──
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(
        apt => new Date(apt.date).toDateString() === today
    ).length;
    const pendingAppointments = appointments.filter(
        apt => apt.status === "pending"
    ).length;
    const availableSlots = slots.filter(
        s => s.status === "available"
    ).length;

    // ── CHAT QUEUE — derived from real appointments ──
    // confirmed chat appointments = patients waiting for chat
    const chatQueue = appointments.filter(
        apt => apt.typeOfAppointment === "chat" && apt.status === "confirmed"
    );

    const stats = [
        { label: "Total Appointments", value: appointments.length.toString(), icon: Users, grad: "linear-gradient(135deg, #0d9488, #06b6d4)", light: "#ccfbf1" },
        { label: "Today's Appointments", value: todayAppointments.toString(), icon: Calendar, grad: "linear-gradient(135deg, #7c3aed, #a78bfa)", light: "#ede9fe" },
        { label: "Pending", value: pendingAppointments.toString(), icon: Clock, grad: "linear-gradient(135deg, #f97316, #fb923c)", light: "#ffedd5" },
        { label: "Open Slots", value: availableSlots.toString(), icon: Activity, grad: "linear-gradient(135deg, #059669, #34d399)", light: "#d1fae5" },
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
                    <span style={{ background: "#ccfbf1", color: "#0d9488", fontWeight: 600 }}
                        className="text-xs px-2 py-1 rounded-full ml-2">Doctor</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* online/offline toggle */}
                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        style={{
                            background: isOnline ? "#d1fae5" : "#fee2e2",
                            color: isOnline ? "#059669" : "#dc2626",
                            fontWeight: 600,
                            border: `1.5px solid ${isOnline ? "#6ee7b7" : "#fca5a5"}`,
                        }}
                        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#059669" : "#dc2626" }} />
                        {isOnline ? "Online" : "Offline"}
                    </button>

                    {/* notifications bell — real data */}
                    <div className="relative">
                        <button
                            onClick={handleNotificationsBell}
                            style={{ background: "#ccfbf1", color: "#0d9488" }}
                            className="p-2 rounded-full hover:opacity-80 transition-opacity relative">
                            <Bell className="h-5 w-5" />
                            {/* unread count badge */}
                            {notifications.filter(n => !n.isRead).length > 0 && (
                                <span style={{ background: "#f97316", color: "white", fontSize: 10, fontWeight: 700 }}
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center">
                                    {notifications.filter(n => !n.isRead).length}
                                </span>
                            )}
                        </button>

                        {/* notifications dropdown */}
                        {showNotifications && (
                            <div style={{ background: "white", border: "1px solid #c9ebe4", boxShadow: "0 8px 30px rgba(13,148,136,0.1)" }}
                                className="absolute right-0 top-12 w-80 rounded-2xl z-50 overflow-hidden">
                                <div style={{ borderBottom: "1px solid #c9ebe4" }} className="p-4">
                                    <h3 style={{ color: "#0f4c3a", fontWeight: 700 }}>Notifications</h3>
                                </div>
                                {isLoadingNotifications ? (
                                    <div className="flex justify-center p-4">
                                        <Loader2 className="animate-spin h-5 w-5" style={{ color: "#0d9488" }} />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <p style={{ color: "#4a7c6f" }} className="text-sm text-center p-4">
                                        No notifications yet
                                    </p>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n._id}
                                            style={{
                                                borderBottom: "1px solid #f0faf8",
                                                background: n.isRead ? "white" : "#f0faf8"  // unread = highlighted
                                            }}
                                            className="p-4 hover:bg-gray-50">
                                            <p style={{ color: "#0f4c3a" }} className="text-sm">{n.text}</p>
                                            <p style={{ color: "#4a7c6f" }} className="text-xs mt-1">
                                                {new Date(n.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <span style={{ color: "#4a7c6f" }} className="text-sm hidden md:block">
                        Dr. <span style={{ color: "#0f4c3a", fontWeight: 700 }}>{username}</span>
                    </span>
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        style={{ border: "1.5px solid #0d9488", color: "#0d9488", fontWeight: 600, background: "white" }}
                        className="flex items-center gap-2 text-sm px-4 py-2 rounded-full hover:opacity-80 transition-opacity">
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* ── PROFILE GREETING ── */}
                <div className="mb-8">
                    <h1 style={{ color: "#0f4c3a", fontWeight: 800, lineHeight: 1.2 }} className="text-4xl mb-1">
                        Good morning, <span style={{
                            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>Dr. {username}</span> 👨‍⚕️
                    </h1>
                    <p style={{ color: "#4a7c6f" }}>
                        {specialization || "General Physician"} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* ── STATS BAR — real data ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map(({ label, value, icon: Icon, grad, light }) => (
                        <div key={label}
                            style={{ background: "white", border: "1px solid #c9ebe4" }}
                            className="rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div style={{ background: light }} className="p-2 rounded-xl">
                                    <div style={{ background: grad }} className="p-1.5 rounded-lg">
                                        <Icon className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                            </div>
                            <p style={{ color: "#0f4c3a", fontWeight: 800 }} className="text-3xl">{value}</p>
                            <p style={{ color: "#4a7c6f" }} className="text-xs mt-1">{label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── LEFT COLUMN ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* ── UPCOMING APPOINTMENTS — real data ── */}
                        <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                            className="rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div style={{ background: "#ccfbf1" }} className="p-2 rounded-xl">
                                        <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }} className="p-1.5 rounded-lg">
                                            <Calendar className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <h2 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg">Upcoming Appointments</h2>
                                </div>
                            </div>

                            {isLoadingAppointments ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
                                </div>
                            ) : appointments.filter(apt => apt.status !== "completed" && apt.status !== "cancelled").length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="h-12 w-12 mx-auto mb-3" style={{ color: "#c9ebe4" }} />
                                    <p style={{ color: "#4a7c6f" }} className="text-sm">No upcoming appointments</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {appointments
                                        .filter(apt => apt.status !== "completed" && apt.status !== "cancelled")
                                        .map((apt, index) => (
                                            <div key={apt._id}
                                                style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                                className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                                                <div className="flex items-center gap-4">
                                                    <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)", minWidth: 36, height: 36 }}
                                                        className="rounded-full flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm">#{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-sm">
                                                            {apt.patientId?.name || "Unknown Patient"}
                                                        </p>
                                                        <p style={{ color: "#4a7c6f" }} className="text-xs">
                                                            {new Date(apt.date).toLocaleDateString()} · {apt.timeSlot}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span style={{
                                                        background: apt.typeOfAppointment === "video" ? "#e0f2fe" : "#ede9fe",
                                                        color: apt.typeOfAppointment === "video" ? "#0284c7" : "#7c3aed",
                                                        fontWeight: 600
                                                    }} className="text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                        {apt.typeOfAppointment === "video"
                                                            ? <Video className="h-3 w-3" />
                                                            : <MessageCircle className="h-3 w-3" />
                                                        }
                                                        {apt.typeOfAppointment}
                                                    </span>
                                                    <span style={{
                                                        background: apt.status === "confirmed" ? "#d1fae5" : "#ffedd5",
                                                        color: apt.status === "confirmed" ? "#059669" : "#f97316",
                                                        fontWeight: 600
                                                    }} className="text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                        {apt.status === "confirmed"
                                                            ? <CheckCircle className="h-3 w-3" />
                                                            : <Clock className="h-3 w-3" />
                                                        }
                                                        {apt.status}
                                                    </span>
                                                    {updatingAppointmentId === apt._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#0d9488" }} />
                                                    ) : (
                                                        <>
                                                            {apt.status === "pending" && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(apt._id, "confirmed")}
                                                                    style={{ background: "linear-gradient(135deg, #059669, #34d399)", color: "white", fontWeight: 600 }}
                                                                    className="text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                                                                    Confirm
                                                                </button>
                                                            )}
                                                            {apt.status === "confirmed" && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(apt._id, "completed")}
                                                                    style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)", color: "white", fontWeight: 600 }}
                                                                    className="text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                                                                    Complete
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleUpdateStatus(apt._id, "cancelled")}
                                                                style={{ background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}
                                                                className="text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* ── SLOT SCHEDULER — real API ── */}
                        <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                            className="rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div style={{ background: "#ede9fe" }} className="p-2 rounded-xl">
                                    <div style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }} className="p-1.5 rounded-lg">
                                        <Clock className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                                <h2 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg">Availability Slots</h2>
                            </div>

                            {/* add new slot form */}
                            <div style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                className="rounded-xl p-4 mb-4">
                                <p style={{ color: "#4a7c6f", fontWeight: 600 }} className="text-sm mb-3">Add New Slot</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <select
                                        value={newSlot.day}
                                        onChange={(e) => setNewSlot(prev => ({ ...prev, day: e.target.value }))}
                                        style={{ border: "1px solid #c9ebe4", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#0f4c3a", background: "white" }}>
                                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <input
                                        type="time"
                                        value={newSlot.from}
                                        onChange={(e) => setNewSlot(prev => ({ ...prev, from: e.target.value }))}
                                        style={{ border: "1px solid #c9ebe4", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#0f4c3a", background: "white" }}
                                    />
                                    <input
                                        type="time"
                                        value={newSlot.to}
                                        onChange={(e) => setNewSlot(prev => ({ ...prev, to: e.target.value }))}
                                        style={{ border: "1px solid #c9ebe4", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#0f4c3a", background: "white" }}
                                    />
                                </div>
                                <button
                                    onClick={handleAddSlot}
                                    disabled={isAddingSlot}
                                    style={{ background: isAddingSlot ? "#c9ebe4" : "linear-gradient(135deg, #7c3aed, #a78bfa)", color: "white", fontWeight: 600 }}
                                    className="mt-3 flex items-center gap-2 text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
                                    {isAddingSlot
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <Plus className="h-4 w-4" />
                                    }
                                    {isAddingSlot ? "Adding..." : "Add Slot"}
                                </button>
                            </div>

                            {/* slots list */}
                            {isLoadingSlots ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="animate-spin h-5 w-5" style={{ color: "#0d9488" }} />
                                </div>
                            ) : slots.length === 0 ? (
                                <p style={{ color: "#4a7c6f" }} className="text-sm text-center py-4">
                                    No slots added yet. Add your first availability slot!
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {slots.map(slot => (
                                        <div key={slot._id}
                                            style={{ border: "1px solid #c9ebe4", background: slot.status === "booked" ? "#fff7ed" : "#f0faf8" }}
                                            className="rounded-xl p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-sm w-24">{slot.day}</span>
                                                <span style={{ color: "#4a7c6f" }} className="text-sm">{slot.from} — {slot.to}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span style={{
                                                    background: slot.status === "available" ? "#d1fae5" : "#ffedd5",
                                                    color: slot.status === "available" ? "#059669" : "#f97316",
                                                    fontWeight: 600
                                                }} className="text-xs px-2 py-1 rounded-full">
                                                    {slot.status}
                                                </span>
                                                {slot.status === "available" && (
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot._id)}
                                                        disabled={deletingSlotId === slot._id}
                                                        style={{ color: "#dc2626" }}
                                                        className="p-1 hover:opacity-70 transition-opacity">
                                                        {deletingSlotId === slot._id
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : <Trash2 className="h-4 w-4" />
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div className="space-y-6">

                        {/* ── PROFILE CARD ── */}
                        <div style={{ background: "linear-gradient(135deg, #0f4c3a, #0d9488)", borderRadius: "20px" }}
                            className="p-6 relative overflow-hidden">
                            <div style={{ background: "rgba(255,255,255,0.05)", width: 120, height: 120, borderRadius: "50%", position: "absolute", right: -30, top: -30 }} />
                            <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }}
                                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative z-10">
                                <Stethoscope className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="text-white font-bold text-lg relative z-10">Dr. {username}</h3>
                            <p style={{ color: "#5eead4" }} className="text-sm relative z-10">{specialization || "General Physician"}</p>
                            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12 }}
                                className="mt-4 p-3 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span style={{ color: "#99f6e4" }} className="text-xs">Status</span>
                                    <span style={{
                                        background: isOnline ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
                                        color: isOnline ? "#34d399" : "#f87171",
                                        fontWeight: 600
                                    }} className="text-xs px-2 py-0.5 rounded-full">
                                        {isOnline ? "● Online" : "● Offline"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── PATIENT SECTION — real data ── */}
                        <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                            className="rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div style={{ background: "#fce7f3" }} className="p-2 rounded-xl">
                                    <div style={{ background: "linear-gradient(135deg, #db2777, #f472b6)" }} className="p-1.5 rounded-lg">
                                        <MessageCircle className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                                <h2 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg">Patients</h2>
                            </div>

                            {/* tabs */}
                            <div style={{ background: "#f0faf8", borderRadius: 12 }} className="flex p-1 mb-4">
                                {(["queue", "history"] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            background: activeTab === tab ? "white" : "transparent",
                                            color: activeTab === tab ? "#0d9488" : "#4a7c6f",
                                            fontWeight: activeTab === tab ? 700 : 500,
                                            boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
                                        }}
                                        className="flex-1 py-2 rounded-xl text-sm transition-all capitalize">
                                        {tab === "queue" ? `Queue (${chatQueue.length})` : "History"}
                                    </button>
                                ))}
                            </div>

                            {/* chat queue — real data from appointments */}
                            {activeTab === "queue" && (
                                <div className="space-y-3">
                                    {chatQueue.length === 0 ? (
                                        <p style={{ color: "#4a7c6f" }} className="text-sm text-center py-4">
                                            No patients in chat queue
                                        </p>
                                    ) : chatQueue.map(apt => (
                                        <div key={apt._id}
                                            style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                            className="rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-sm">
                                                    {apt.patientId?.name || "Unknown"}
                                                </p>
                                                <span style={{ color: "#4a7c6f" }} className="text-xs">
                                                    {apt.timeSlot}
                                                </span>
                                            </div>
                                            <p style={{ color: "#4a7c6f" }} className="text-xs mb-3">
                                                {new Date(apt.date).toLocaleDateString()}
                                            </p>
                                            {/* TODO: redirect to chat page */}
                                            <button
                                                style={{ background: "linear-gradient(135deg, #db2777, #f472b6)", color: "white", fontWeight: 600 }}
                                                className="w-full text-xs py-2 rounded-lg hover:opacity-90 transition-opacity">
                                                Start Chat
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* past patients history — real data */}
                            {activeTab === "history" && (
                                <div className="space-y-2">
                                    {isLoadingPastPatients ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="animate-spin h-5 w-5" style={{ color: "#0d9488" }} />
                                        </div>
                                    ) : pastPatients.length === 0 ? (
                                        <p style={{ color: "#4a7c6f" }} className="text-sm text-center py-4">
                                            No past patients yet
                                        </p>
                                    ) : pastPatients.map(p => (
                                        <div key={p.patientId}
                                            style={{ border: "1px solid #c9ebe4" }}
                                            className="rounded-xl p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div>
                                                <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-sm">{p.name}</p>
                                                <p style={{ color: "#4a7c6f" }} className="text-xs">
                                                    {new Date(p.lastInteraction).toLocaleDateString()} · {p.interactions} interactions
                                                </p>
                                            </div>
                                            <button style={{ color: "#0d9488" }} className="hover:opacity-70">
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <footer style={{ borderTop: "1px solid #c9ebe4", color: "#4a7c6f" }} className="text-center py-6 text-sm mt-10">
                © 2026 MedAssist. All rights reserved.
            </footer>
        </div>
    )
}

export default DoctorDashboard;