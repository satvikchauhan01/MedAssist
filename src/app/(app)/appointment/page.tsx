'use client'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/src/types/ApiResponse';
import { Loader2, Stethoscope, Clock, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';

// ── TYPES ──
interface Doctor {
    _id: string
    name: string
    specialization: string
    username: string
}

interface Slot {
    _id: string
    day: string
    from: string
    to: string
    status: "available" | "booked"
}

// constant consultation fee
const CONSULTATION_FEE = 1;

const AppointmentPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    // ── STATE ──
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [appointmentType, setAppointmentType] = useState<"video" | "chat">("video");
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    // ── load Razorpay script on mount ──
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); }
    }, []);

    // auth protection
    useEffect(() => {
        if (status === "unauthenticated") router.replace("/signIn");
        if (status === "authenticated" && session?.user?.role === "doctor") {
            router.replace("/doctor/dashboard"); // doctors can't book appointments
        }
    }, [status, session]);

    // fetch doctors on load
    useEffect(() => {
        if (status === "authenticated") {
            fetchDoctors();
        }
    }, [status]);

    if (status === "loading") return (
        <div className="flex justify-center items-center min-h-screen" style={{ background: "#f0faf8" }}>
            <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
        </div>
    )
    if (!session) return null;

    // ── FETCH ALL DOCTORS ──
    const fetchDoctors = async () => {
        setIsLoadingDoctors(true);
        try {
            const response = await axios.get('/api/doctors/list');
            if (response.data.success) {
                setDoctors(response.data.doctors);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to fetch doctors.");
        } finally {
            setIsLoadingDoctors(false);
        }
    }

    // ── FETCH SLOTS FOR SELECTED DOCTOR ──
    // passes doctorId and optionally date to filter already booked slots
    const fetchSlots = async (doctorId: string, date?: string) => {
        setIsLoadingSlots(true);
        setSlots([]);
        setSelectedSlot(null);
        try {
            const url = date
                ? `/api/slots/list?doctorId=${doctorId}&date=${date}`
                : `/api/slots/list?doctorId=${doctorId}`;
            const response = await axios.get(url);
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

    // ── SELECT DOCTOR → fetch their slots ──
    const handleSelectDoctor = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setSelectedDate("");     // reset date when doctor changes
        setSelectedSlot(null);   // reset slot when doctor changes
        fetchSlots(doctor._id);  // fetch slots without date filter initially
    }

    // ── DATE CHANGES → refetch slots with date filter ──
    // this shows only slots available on the selected date
    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        setSelectedSlot(null);  // reset slot when date changes
        if (selectedDoctor) {
            fetchSlots(selectedDoctor._id, date);  // refetch with date filter
        }
    }

    // ── BOOK APPOINTMENT WITH PAYMENT ──
    const handleBookAppointment = async () => {
        if (!selectedDoctor || !selectedSlot || !selectedDate) {
            toast.error("Please select a doctor, slot and date.");
            return;
        }

        setIsBooking(true);
        try {
            // step 1 — create Razorpay order
            const orderResponse = await axios.post('/api/payments/create-order', {
                doctorId: selectedDoctor._id,
            });

            if (!orderResponse.data.success) {
                toast.error(orderResponse.data.message);
                setIsBooking(false);
                return;
            }

            const { orderId, amount, currency } = orderResponse.data;

            // step 2 — book appointment with paymentStatus: "pending"
            // webhook will update to "paid" after payment succeeds
            const bookResponse = await axios.post('/api/appointments/book', {
                doctorId: selectedDoctor._id,
                slotId: selectedSlot._id,
                date: selectedDate,
                timeSlot: `${selectedSlot.from} - ${selectedSlot.to}`,
                typeOfAppointment: appointmentType,
                orderId,  // link appointment to Razorpay order for webhook
            });

            if (!bookResponse.data.success) {
                toast.error(bookResponse.data.message);
                setIsBooking(false);
                return;
            }

            const appointmentId = bookResponse.data.appointment._id;

            // step 3 — open Razorpay payment modal
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount,
                currency,
                name: "MedAssist",
                description: `Consultation with Dr. ${selectedDoctor.name} — ₹${CONSULTATION_FEE}`,
                order_id: orderId,

                // step 4 — payment success handler
                handler: async (response: any) => {
                    try {
                        // verify payment signature on backend
                        const verifyResponse = await axios.post('/api/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verifyResponse.data.success) {
                            toast.success("Appointment booked & payment successful! 🎉");
                            // reset all selections
                            setSelectedDoctor(null);
                            setSelectedSlot(null);
                            setSelectedDate("");
                            setSlots([]);
                        }
                    } catch (error) {
                        // even if frontend verify fails
                        // webhook will handle payment confirmation
                        toast.success("Payment received! Appointment being confirmed shortly.");
                    }
                    setIsBooking(false);
                },

                prefill: {
                    name: session?.user?.username || "",
                    email: session?.user?.email || "",
                },

                theme: { color: "#0d9488" },  // our teal color

                modal: {
                    // user closes modal without paying
                    ondismiss: async () => {
                        try {
                            // cancel the appointment that was created in step 2
                            // this also frees up the slot date
                            await axios.put('/api/appointments/update-status', {
                                appointmentId,
                                status: "cancelled"
                            });

                            await axios.put('/api/appointments/cancel-by-patient', {
                                appointmentId,
                            });
                        } catch (error) {
                            console.error("Failed to cancel appointment on dismiss");
                        }
                        toast.error("Payment cancelled. Appointment not booked.");
                        setIsBooking(false);
                    }
                }
            };

            // open Razorpay modal
            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();

        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to initiate payment.");
            setIsBooking(false);
        }
    }

    return (
        <div className="min-h-screen" style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* ── HEADER ── */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        style={{ color: "#0d9488", fontWeight: 600 }}
                        className="flex items-center gap-1 text-sm mb-4 hover:opacity-80">
                        <ChevronLeft className="h-4 w-4" /> Back
                    </button>
                    <h1 style={{ color: "#0f4c3a", fontWeight: 800 }} className="text-4xl mb-1">
                        Book an{" "}
                        <span style={{
                            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>Appointment</span>
                    </h1>
                    <p style={{ color: "#4a7c6f" }}>
                        Select a doctor and choose an available slot · Consultation fee ₹{CONSULTATION_FEE}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ── STEP 1: SELECT DOCTOR ── */}
                    <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                        className="rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div style={{ background: "#ccfbf1" }} className="p-2 rounded-xl">
                                <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }} className="p-1.5 rounded-lg">
                                    <Stethoscope className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <h2 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg">
                                Step 1 — Select Doctor
                            </h2>
                        </div>

                        {isLoadingDoctors ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
                            </div>
                        ) : doctors.length === 0 ? (
                            <p style={{ color: "#4a7c6f" }} className="text-sm text-center py-8">
                                No doctors available yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {doctors.map(doctor => (
                                    <div
                                        key={doctor._id}
                                        onClick={() => handleSelectDoctor(doctor)}
                                        style={{
                                            border: selectedDoctor?._id === doctor._id
                                                ? "2px solid #0d9488"
                                                : "1px solid #c9ebe4",
                                            background: selectedDoctor?._id === doctor._id
                                                ? "#f0faf8"
                                                : "white"
                                        }}
                                        className="p-4 rounded-xl cursor-pointer hover:border-teal-400 transition-all flex items-center justify-between">
                                        <div>
                                            <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-sm">
                                                Dr. {doctor.name}
                                            </p>
                                            <p style={{ color: "#4a7c6f" }} className="text-xs">
                                                {doctor.specialization || "General Physician"}
                                            </p>
                                            {/* consultation fee badge */}
                                            <p style={{ color: "#0d9488", fontWeight: 700 }} className="text-xs mt-1">
                                                ₹{CONSULTATION_FEE} consultation fee
                                            </p>
                                        </div>
                                        {selectedDoctor?._id === doctor._id && (
                                            <div style={{ background: "#0d9488" }} className="w-5 h-5 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs">✓</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── STEP 2: SELECT SLOT ── */}
                    <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                        className="rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div style={{ background: "#ede9fe" }} className="p-2 rounded-xl">
                                <div style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }} className="p-1.5 rounded-lg">
                                    <Clock className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <h2 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg">
                                Step 2 — Select Slot
                            </h2>
                        </div>

                        {!selectedDoctor ? (
                            <p style={{ color: "#4a7c6f" }} className="text-sm text-center py-8">
                                Please select a doctor first
                            </p>
                        ) : isLoadingSlots ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
                            </div>
                        ) : slots.length === 0 ? (
                            <p style={{ color: "#4a7c6f" }} className="text-sm text-center py-8">
                                {selectedDate
                                    ? `No available slots for Dr. ${selectedDoctor.name} on this date`
                                    : `No slots added by Dr. ${selectedDoctor.name} yet`
                                }
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {slots.map(slot => (
                                    <div
                                        key={slot._id}
                                        onClick={() => setSelectedSlot(slot)}
                                        style={{
                                            border: selectedSlot?._id === slot._id
                                                ? "2px solid #7c3aed"
                                                : "1px solid #c9ebe4",
                                            background: selectedSlot?._id === slot._id
                                                ? "#f5f3ff"
                                                : "#f0faf8"
                                        }}
                                        className="p-3 rounded-xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-between">
                                        <div>
                                            <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-sm">
                                                {slot.day}
                                            </p>
                                            <p style={{ color: "#4a7c6f" }} className="text-xs">
                                                {slot.from} — {slot.to}
                                            </p>
                                        </div>
                                        {selectedSlot?._id === slot._id && (
                                            <div style={{ background: "#7c3aed" }} className="w-5 h-5 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs">✓</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── STEP 3: DATE + TYPE + CONFIRM ── */}
                {selectedDoctor && selectedSlot && (
                    <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                        className="rounded-2xl p-6 shadow-sm mt-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div style={{ background: "#ffedd5" }} className="p-2 rounded-xl">
                                <div style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }} className="p-1.5 rounded-lg">
                                    <Calendar className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <h2 style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-lg">
                                Step 3 — Confirm Booking
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                            {/* doctor summary */}
                            <div style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                className="rounded-xl p-4">
                                <p style={{ color: "#4a7c6f" }} className="text-xs mb-1">Doctor</p>
                                <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-sm">
                                    Dr. {selectedDoctor.name}
                                </p>
                                <p style={{ color: "#4a7c6f" }} className="text-xs">
                                    {selectedDoctor.specialization}
                                </p>
                            </div>

                            {/* slot summary */}
                            <div style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                className="rounded-xl p-4">
                                <p style={{ color: "#4a7c6f" }} className="text-xs mb-1">Slot</p>
                                <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-sm">
                                    {selectedSlot.day}
                                </p>
                                <p style={{ color: "#4a7c6f" }} className="text-xs">
                                    {selectedSlot.from} — {selectedSlot.to}
                                </p>
                            </div>

                            {/* date picker */}
                            <div style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                className="rounded-xl p-4">
                                <p style={{ color: "#4a7c6f" }} className="text-xs mb-2">Select Date</p>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    min={new Date().toISOString().split("T")[0]}  // no past dates
                                    onChange={(e) => handleDateChange(e.target.value)}  // 👈 refetches slots with date
                                    style={{ border: "1px solid #c9ebe4", borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "#0f4c3a", background: "white", width: "100%" }}
                                />
                            </div>
                        </div>

                        {/* appointment type */}
                        <div className="mb-6">
                            <p style={{ color: "#4a7c6f", fontWeight: 600 }} className="text-sm mb-3">
                                Appointment Type
                            </p>
                            <div className="flex gap-3">
                                {(["video", "chat"] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setAppointmentType(type)}
                                        style={{
                                            background: appointmentType === type
                                                ? "linear-gradient(135deg, #0d9488, #06b6d4)"
                                                : "white",
                                            color: appointmentType === type ? "white" : "#4a7c6f",
                                            border: appointmentType === type
                                                ? "none"
                                                : "1px solid #c9ebe4",
                                            fontWeight: 600
                                        }}
                                        className="px-6 py-2.5 rounded-xl text-sm capitalize hover:opacity-90 transition-all">
                                        {type === "video" ? "📹 Video Call" : "💬 Chat"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── CONSULTATION FEE SUMMARY ── */}
                        <div style={{ background: "#ccfbf1", border: "1px solid #c9ebe4" }}
                            className="rounded-xl p-4 mb-6 flex items-center justify-between">
                            <div>
                                <p style={{ color: "#0f4c3a", fontWeight: 600 }}>Consultation Fee</p>
                                <p style={{ color: "#4a7c6f" }} className="text-xs">
                                    Secure payment via Razorpay
                                </p>
                            </div>
                            <p style={{ color: "#0d9488", fontWeight: 800, fontSize: 24 }}>
                                ₹{CONSULTATION_FEE}
                            </p>
                        </div>

                        {/* ── PAY & BOOK BUTTON ── */}
                        <button
                            onClick={handleBookAppointment}
                            disabled={isBooking || !selectedDate}
                            style={{
                                background: isBooking || !selectedDate
                                    ? "#c9ebe4"
                                    : "linear-gradient(135deg, #0d9488, #06b6d4)",
                                color: "white",
                                fontWeight: 700,
                                padding: "14px 32px",
                                borderRadius: "12px",
                                border: "none",
                                cursor: isBooking || !selectedDate ? "not-allowed" : "pointer"
                            }}
                            className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                            {isBooking
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing Payment...</>
                                : <>Pay ₹{CONSULTATION_FEE} & Book Appointment <ChevronRight className="h-4 w-4" /></>
                            }
                        </button>

                        {/* helper text */}
                        {!selectedDate && (
                            <p style={{ color: "#f97316" }} className="text-xs mt-2">
                                ⚠️ Please select a date to proceed with payment
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AppointmentPage;
