'use client'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/src/types/ApiResponse';
import { HeartPulse, Users, ChevronLeft, Loader2, Calendar } from 'lucide-react';

interface PastPatient {
    patientId: string
    name: string
    age: number
    lastInteraction: string
    interactions: number
}

const DoctorPatientsPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [patients, setPatients] = useState<PastPatient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/signIn");
        if (status === "authenticated" && session?.user?.role !== "doctor") {
            router.replace("/Home");
        }
    }, [status, session]);

    useEffect(() => {
        if (status === "authenticated") fetchPatients();
    }, [status]);

    if (status === "loading") return (
        <div className="flex justify-center items-center min-h-screen" style={{ background: "#f0faf8" }}>
            <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
        </div>
    )
    if (!session) return null;

    const fetchPatients = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/appointments/past-patients');
            if (response.data.success) {
                setPatients(response.data.pastPatients);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error(axiosError.response?.data.message || "Failed to fetch patients.");
        } finally {
            setIsLoading(false);
        }
    }

    // filter patients by search query
    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                            My Patients
                        </h1>
                    </div>
                    <p style={{ color: "#4a7c6f" }}>
                        {patients.length} unique patients consulted
                    </p>
                </div>

                {/* ── SEARCH BAR ── */}
                <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                    className="rounded-2xl p-4 mb-6 shadow-sm flex items-center gap-3">
                    <Users className="h-5 w-5" style={{ color: "#0d9488" }} />
                    <input
                        type="text"
                        placeholder="Search patients by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ border: "none", outline: "none", color: "#0f4c3a", background: "transparent", width: "100%", fontSize: 14 }}
                    />
                </div>

                {/* ── PATIENTS LIST ── */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin h-8 w-8" style={{ color: "#0d9488" }} />
                    </div>
                ) : filteredPatients.length === 0 ? (
                    <div style={{ background: "white", border: "1px solid #c9ebe4" }}
                        className="rounded-2xl p-16 text-center shadow-sm">
                        <Users className="h-16 w-16 mx-auto mb-4" style={{ color: "#c9ebe4" }} />
                        <p style={{ color: "#4a7c6f" }} className="text-lg">
                            {searchQuery ? "No patients match your search" : "No patients yet"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPatients.map((p, index) => (
                            <div key={p.patientId}
                                style={{ background: "white", border: "1px solid #c9ebe4" }}
                                className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    {/* avatar */}
                                    <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)", minWidth: 48, height: 48 }}
                                        className="rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">
                                            {p.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p style={{ color: "#0f4c3a", fontWeight: 700 }} className="text-base">{p.name}</p>
                                        <p style={{ color: "#4a7c6f" }} className="text-xs">Age {p.age}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                        className="rounded-xl p-3">
                                        <p style={{ color: "#4a7c6f" }} className="text-xs mb-1">Last Visit</p>
                                        <p style={{ color: "#0f4c3a", fontWeight: 600 }} className="text-sm">
                                            {new Date(p.lastInteraction).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div style={{ background: "#f0faf8", border: "1px solid #c9ebe4" }}
                                        className="rounded-xl p-3">
                                        <p style={{ color: "#4a7c6f" }} className="text-xs mb-1">Total Visits</p>
                                        <p style={{ color: "#0f4c3a", fontWeight: 600 }} className="text-sm">
                                            {p.interactions} {p.interactions === 1 ? "visit" : "visits"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DoctorPatientsPage;