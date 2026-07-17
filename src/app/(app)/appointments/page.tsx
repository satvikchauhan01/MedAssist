'use client'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/src/types/ApiResponse';
import {
    HeartPulse, Calendar, ChevronLeft, Loader2,
    Video, MessageCircle, CheckCircle, Clock,
    XCircle, CreditCard, AlertCircle
} from 'lucide-react';

// ── TYPES ──
interface Appointment {
    _id: string
    doctorId: {
        _id: string
        name: string
        specialization: string
        username: string
    }
    slotId: {
        _id: string
        day: string
        from: string
        to: string
    }
    date: string
    timeSlot: string
    typeOfAppointment: "video" | "chat"
    status: "pending" | "confirmed" | "completed" | "cancelled"
    paymentStatus: "pending" | "paid" | "failed" | "refunded"
    amount: number
    orderId: string
}

const statusColors: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "#ffedd5", color: "#f97316" },
    confirmed: { bg: "#d1fae5", color: "#059669" },
    completed: { bg: "#e0f2fe", color: "#0284c7" },
    cancelled: { bg: "#fee2e2", color: "#dc2626" },
}

const paymentColors: Record<string, { bg: string; color: string }> = {
    pending:  { bg: "#ffedd5", color: "#f97316" },
    paid:     { bg: "#d1fae5", color: "#059669" },
    failed:   { bg: "#fee2e2", color: "#dc2626" },
    refunded: { bg: "#e0f2fe", color: "#0284c7" },
}

const PatientAppointmentsPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const statusFilters = ["all", "pending", "confirmed", "completed", "cancelled"];

    // auth protection
    useEffect(() => {
        if (status === "unauthenticated") router.replace("/signIn");
        if (status === "authenticated" && session?.user?.role === "doctor") {
            router.replace("/doctor/dashboard");
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

    // ── FETCH PATIENT APPOINTMENTS ──
    const fetchAppointments = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/appointments/patient-list');
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

    // ── CANCEL APPOINTMENT ──
    // patient can only cancel pending appointments
    const handleCancelAppointment = async (appointmentId: string) => {
        setCancellingId(appointmentId);
        try {
            const response = await axios.put('/api/appointments/cancel-by-patient', {
                appointmentId,
            });
            if (response.data.success) {
                toast.success(response.data.message);
                // update state directly
                setAppointments(prev =>
                    prev.map(apt =>
                        apt._id === appointmentId
                            ? { ...apt, status: "cancelled" as const }
                            : apt
                    )
                );
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to cancel appointment.");
        } finally {
            setCancellingId(null);
        }
    }

    // filter appointments
    const filteredAppointments = activeFilter === "all"
        ? appointments
        : appointments.filter(apt => apt.status === activeFilter);

    return (
        <div className="min-h-screen" style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>
            <div className="max-w-4xl mx-auto px-6 py-10">

                {/* ── HEADER ── */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push("/dashboard")}
                        style={{ color: "#0d9488", fontWeight: 600 }}
                        className="flex items-center gap-1 text-sm mb-4 hover:opacity-80">
                        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3 mb-1">
                        <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }}
                            className="p-2 rounded-xl">
                            <HeartPulse className="h-5 w-5 text-white" />
                        </div>
                        <h1 style={{ color: "#0f4c3a", fontWeight: 800 }} className="text-4xl">
                            My Appointments
                        </h1>
                    </div>
                    <p style={{ color: "#4a7c6f" }}>
                        {appointments.length} total · {appointments.filter(a => a.status === "confirmed").length} confirmed
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
                        <p style={{ color: "#4a7c6f" }} className="text-lg mb-4">
                            {activeFilter === "all"
                                ? "No appointments yet"
                                : `No ${activeFilter} appointments`
                            }
                        </p>
                        {activeFilter === "all" && (
                            <button
                                onClick={() => router.push("/appointment")}
                                style={{
                                    background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                                    color: "white",
                                    fontWeight: 700,
                                    padding: "12px 24px",
                                    borderRadius: 12,
                                    border: "none",
                                    cursor: "pointer"
                                }}
                                className="hover:opacity-90 transition-opacity">
                                Book Your First Appointment
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAppointments.map((apt, index) => (
                            <div key={apt._id}
                                style={{ background: "white", border: "1px solid #c9ebe4" }}
                                className="rounded-2xl p-6 shadow-sm">

                                <div className="flex items-start justify-between flex-wrap gap-4">

                                    {/* ── LEFT: DOCTOR INFO ── */}
                                    <div className="flex items-center gap-4">
                                        {/* appointment number */}
                                        <div style={{
                                            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                                            minWidth: 44, height: 44
                                        }} className="rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">#{index + 1}</span>
                                        </div>
                                        <div>
                                            <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-base">
                                                Dr. {apt.doctorId?.name || "Unknown Doctor"}
                                            </p>
                                            <p style={{ color: "#4a7c6f" }} className="text-xs">
                                                {apt.doctorId?.specialization || "General Physician"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ── RIGHT: STATUS BADGES ── */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* appointment status */}
                                        <span style={{
                                            background: statusColors[apt.status]?.bg,
                                            color: statusColors[apt.status]?.color,
                                            fontWeight: 600
                                        }} className="text-xs px-3 py-1.5 rounded-full capitalize flex items-center gap-1">
                                            {apt.status === "confirmed" && <CheckCircle className="h-3 w-3" />}
                                            {apt.status === "pending" && <Clock className="h-3 w-3" />}
                                            {apt.status === "completed" && <CheckCircle className="h-3 w-3" />}
                                            {apt.status === "cancelled" && <XCircle className="h-3 w-3" />}
                                            {apt.status}
                                        </span>

                                        {/* payment status */}
                                        <span style={{
                                            background: paymentColors[apt.paymentStatus]?.bg,
                                            color: paymentColors[apt.paymentStatus]?.color,
                                            fontWeight: 600
                                        }} className="text-xs px-3 py-1.5 rounded-full capitalize flex items-center gap-1">
                                            <CreditCard className="h-3 w-3" />
                                            {apt.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                {/* ── APPOINTMENT DETAILS ── */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">

                                    <div style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                        className="rounded-xl p-3">
                                        <p style={{ color: "#4a7c6f" }} className="text-xs mb-1">Date</p>
                                        <p style={{ color: "#0f4c3a", fontWeight: 600 }} className="text-sm">
                                            {new Date(apt.date).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                        className="rounded-xl p-3">
                                        <p style={{ color: "#4a7c6f" }} className="text-xs mb-1">Time</p>
                                        <p style={{ color: "#0f4c3a", fontWeight: 600 }} className="text-sm">
                                            {apt.timeSlot}
                                        </p>
                                    </div>

                                    <div style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                        className="rounded-xl p-3">
                                        <p style={{ color: "#4a7c6f" }} className="text-xs mb-1">Type</p>
                                        <p style={{ color: "#0f4c3a", fontWeight: 600 }} className="text-sm flex items-center gap-1">
                                            {apt.typeOfAppointment === "video"
                                                ? <><Video className="h-3 w-3" style={{ color: "#0284c7" }} /> Video Call</>
                                                : <><MessageCircle className="h-3 w-3" style={{ color: "#7c3aed" }} /> Chat</>
                                            }
                                        </p>
                                    </div>

                                    <div style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                        className="rounded-xl p-3">
                                        <p style={{ color: "#4a7c6f" }} className="text-xs mb-1">Amount Paid</p>
                                        <p style={{ color: "#0d9488", fontWeight: 700 }} className="text-sm">
                                            ₹{apt.amount || 500}
                                        </p>
                                    </div>
                                </div>

                                {/* ── PAYMENT FAILED WARNING ── */}
                                {apt.paymentStatus === "failed" && (
                                    <div style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}
                                        className="rounded-xl p-3 mt-4 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" style={{ color: "#dc2626" }} />
                                        <p style={{ color: "#dc2626" }} className="text-xs font-medium">
                                            Payment failed. Your slot has been released. Please book again.
                                        </p>
                                    </div>
                                )}

                                {/* ── REFUND INFO ── */}
                                {apt.paymentStatus === "refunded" && (
                                    <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd" }}
                                        className="rounded-xl p-3 mt-4 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" style={{ color: "#0284c7" }} />
                                        <p style={{ color: "#0284c7" }} className="text-xs font-medium">
                                            Refund of ₹{apt.amount || 500} has been initiated to your account.
                                        </p>
                                    </div>
                                )}

                                {/* ── CANCEL BUTTON ── */}
                                {/* only show for pending appointments with paid status */}
                                {apt.status === "pending" && apt.paymentStatus === "paid" && (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={() => handleCancelAppointment(apt._id)}
                                            disabled={cancellingId === apt._id}
                                            style={{
                                                background: "#fee2e2",
                                                color: "#dc2626",
                                                fontWeight: 600,
                                                padding: "8px 16px",
                                                borderRadius: 10,
                                                border: "none",
                                                cursor: cancellingId === apt._id ? "not-allowed" : "pointer"
                                            }}
                                            className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity">
                                            {cancellingId === apt._id
                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                : <XCircle className="h-3 w-3" />
                                            }
                                            Cancel Appointment
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PatientAppointmentsPage;