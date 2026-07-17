'use client'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/src/types/ApiResponse';
import {
    HeartPulse, Calendar, ChevronLeft, Loader2,
    Video, MessageCircle, CheckCircle, Clock, XCircle
} from 'lucide-react';

interface Appointment {
    _id: string
    patientId: { _id: string; name: string; age: number; gender: string }
    slotId: { _id: string; day: string; from: string; to: string }
    date: string
    timeSlot: string
    typeOfAppointment: "video" | "chat"
    status: "pending" | "confirmed" | "completed" | "cancelled"
}

const statusFilters = ["all", "pending", "confirmed", "completed", "cancelled"];

const DoctorAppointmentsPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/signIn");
        if (status === "authenticated" && session?.user?.role !== "doctor") {
            router.replace("/Home");
        }
    }, [status, session]);

    useEffect(() => {
        if (status === "authenticated") fetchAppointments();
    }, [status]);

    if (status === "loading") return (
        <div className="flex justify-center items-center min-h-screen" style={{ background: "#f0faf8" }}>
            <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
        </div>
    )
    if (!session) return null;

    const fetchAppointments = async () => {
        setIsLoading(true);
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
            setIsLoading(false);
        }
    }

    const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
        setUpdatingId(appointmentId);
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
            toast.error(axiosError.response?.data.message || "Failed to update.");
        } finally {
            setUpdatingId(null);
        }
    }

    // filter appointments based on active filter
    const filteredAppointments = activeFilter === "all"
        ? appointments
        : appointments.filter(apt => apt.status === activeFilter);

    const statusColors: Record<string, { bg: string; color: string }> = {
        pending:   { bg: "#ffedd5", color: "#f97316" },
        confirmed: { bg: "#d1fae5", color: "#059669" },
        completed: { bg: "#e0f2fe", color: "#0284c7" },
        cancelled: { bg: "#fee2e2", color: "#dc2626" },
    }

    return (
        <div className="min-h-screen" style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* ── HEADER ── */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push("/doctor/dashboard")}
                        style={{ color: "#0d9488", fontWeight: 600 }}
                        className="flex items-center gap-1 text-sm mb-4 hover:opacity-80">
                        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3 mb-1">
                        <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }} className="p-2 rounded-xl">
                            <HeartPulse className="h-5 w-5 text-white" />
                        </div>
                        <h1 style={{ color: "#0f4c3a", fontWeight: 800 }} className="text-4xl">
                            All Appointments
                        </h1>
                    </div>
                    <p style={{ color: "#4a7c6f" }}>
                        {appointments.length} total · {appointments.filter(a => a.status === "pending").length} pending
                    </p>
                </div>

                {/* ── FILTER TABS ── */}
                <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                    className="rounded-2xl p-2 mb-6 flex gap-2 flex-wrap shadow-sm">
                    {statusFilters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            style={{
                                background: activeFilter === filter
                                    ? "linear-gradient(135deg, #0d9488, #06b6d4)"
                                    : "transparent",
                                color: activeFilter === filter ? "white" : "#4a7c6f",
                                fontWeight: 600
                            }}
                            className="px-4 py-2 rounded-xl text-sm capitalize transition-all hover:opacity-80">
                            {filter} {filter !== "all" && `(${appointments.filter(a => a.status === filter).length})`}
                        </button>
                    ))}
                </div>

                {/* ── APPOINTMENTS LIST ── */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin h-8 w-8" style={{ color: "#0d9488" }} />
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                        className="rounded-2xl p-16 text-center shadow-sm">
                        <Calendar className="h-16 w-16 mx-auto mb-4" style={{ color: "#c9ebe4" }} />
                        <p style={{ color: "#4a7c6f" }} className="text-lg">
                            No {activeFilter === "all" ? "" : activeFilter} appointments found
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredAppointments.map((apt, index) => (
                            <div key={apt._id}
                                style={{ background: "white", border: "1px solid #c9ebe4" }}
                                className="rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">

                                <div className="flex items-center gap-4">
                                    {/* number */}
                                    <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)", minWidth: 40, height: 40 }}
                                        className="rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">#{index + 1}</span>
                                    </div>
                                    {/* patient info */}
                                    <div>
                                        <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-base">
                                            {apt.patientId?.name || "Unknown Patient"}
                                        </p>
                                        <p style={{ color: "#4a7c6f" }} className="text-xs">
                                            Age {apt.patientId?.age} · {apt.patientId?.gender}
                                        </p>
                                        <p style={{ color: "#4a7c6f" }} className="text-xs mt-0.5">
                                            {new Date(apt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {apt.timeSlot}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* type badge */}
                                    <span style={{
                                        background: apt.typeOfAppointment === "video" ? "#e0f2fe" : "#ede9fe",
                                        color: apt.typeOfAppointment === "video" ? "#0284c7" : "#7c3aed",
                                        fontWeight: 600
                                    }} className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                                        {apt.typeOfAppointment === "video"
                                            ? <Video className="h-3 w-3" />
                                            : <MessageCircle className="h-3 w-3" />
                                        }
                                        {apt.typeOfAppointment}
                                    </span>

                                    {/* status badge */}
                                    <span style={{
                                        background: statusColors[apt.status]?.bg,
                                        color: statusColors[apt.status]?.color,
                                        fontWeight: 600
                                    }} className="text-xs px-3 py-1.5 rounded-full capitalize">
                                        {apt.status}
                                    </span>

                                    {/* action buttons */}
                                    {updatingId === apt._id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#0d9488" }} />
                                    ) : (
                                        <>
                                            {apt.status === "pending" && (
                                                <button
                                                    onClick={() => handleUpdateStatus(apt._id, "confirmed")}
                                                    style={{ background: "linear-gradient(135deg, #059669, #34d399)", color: "white", fontWeight: 600 }}
                                                    className="text-xs px-3 py-1.5 rounded-lg hover:opacity-90 flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" /> Confirm
                                                </button>
                                            )}
                                            {apt.status === "confirmed" && (
                                                <button
                                                    onClick={() => handleUpdateStatus(apt._id, "completed")}
                                                    style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)", color: "white", fontWeight: 600 }}
                                                    className="text-xs px-3 py-1.5 rounded-lg hover:opacity-90 flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" /> Complete
                                                </button>
                                            )}
                                            {(apt.status === "pending" || apt.status === "confirmed") && (
                                                <button
                                                    onClick={() => handleUpdateStatus(apt._id, "cancelled")}
                                                    style={{ background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}
                                                    className="text-xs px-3 py-1.5 rounded-lg hover:opacity-90 flex items-center gap-1">
                                                    <XCircle className="h-3 w-3" /> Cancel
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DoctorAppointmentsPage;
