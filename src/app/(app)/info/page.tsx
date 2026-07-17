'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import * as z from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { FormField, FormControl, Form, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { toast } from "sonner";
import { Input } from '@/components/ui/input';
import { Loader2, HeartPulse, ClipboardList } from 'lucide-react';
import { infoSchema } from '@/src/schemas/infoSchema';
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/src/types/ApiResponse';

const infopage = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { data: session, status, update } = useSession();

    const form = useForm<z.infer<typeof infoSchema>>({
        resolver: zodResolver(infoSchema),
        defaultValues: {
            name: "",
            age: undefined,
            weight: undefined,
            gender: "male" as const,
            role: "user" as const,
            specialization: "",
        }
    })

    const selectedRole = form.watch("role");  // watch role changes to show/hide specialization

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/signIn");
        }
    }, [status]);

    if (status === "loading") return (
        <div className="flex justify-center items-center min-h-screen" style={{ background: "#f0faf8" }}>
            <Loader2 className="animate-spin h-6 w-6" style={{ color: "#0d9488" }} />
        </div>
    )
    if (!session) return null;

    const onSubmit = async (data: z.infer<typeof infoSchema>) => {
        setIsSubmitting(true);
        try {
            const response = await axios.post('/api/info', data);
            if (response.data.success) {
                toast.success("Success", { description: response.data.message });
                // await update({ isNewUser: false });  //  no longer needed because we are setting isNewUser in token itself based on whether name is filled or not
                 await update();  // 👈 this is the RIGHT way
    
                if (response.data.role === "doctor") {
                    window.location.href = "/doctor/dashboard";
                } else {
                    window.location.href = "/Home";
                }
            } else {
                toast.error("Failed", { description: response.data.message });
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast.error("Failed", { description: axiosError.response?.data.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    // shared select style
    const selectStyle = {
        width: "100%",
        border: "1px solid #c9ebe4",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "14px",
        color: "#0f4c3a",
        background: "white",
        outline: "none",
    };

    return (
        <div className="flex justify-center items-center min-h-screen py-10"
            style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>

            {/* decorative blobs */}
            <div style={{ background: "radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)" }}
                className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none" />
            <div style={{ background: "radial-gradient(circle, rgba(251,113,133,0.08) 0%, transparent 70%)" }}
                className="fixed bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none" />

            <div className="w-full max-w-md p-8 space-y-6 relative z-10"
                style={{ background: "white", borderRadius: "24px", border: "1px solid #c9ebe4", boxShadow: "0 8px 40px rgba(13,148,136,0.08)" }}>

                {/* ── LOGO + HEADER ── */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }} className="p-3 rounded-2xl">
                            <ClipboardList className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 style={{ color: "#0f4c3a", fontWeight: 800, lineHeight: 1.2 }} className="text-3xl mb-2">
                        Your{" "}
                        <span style={{
                            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            Information
                        </span>
                    </h1>
                    <p style={{ color: "#4a7c6f" }} className="text-sm">
                        Fill in your details to get started
                    </p>
                </div>

                {/* ── FORM ── */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                        {/* name field */}
                        <FormField name="name" control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter your name"
                                            style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* age and weight side by side */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField name="age" control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Age</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Your age"
                                                style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField name="weight" control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Weight (kg)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Your weight"
                                                style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* gender field */}
                        <FormField name="gender" control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Gender</FormLabel>
                                    <FormControl>
                                        <select {...field} style={selectStyle}>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="others">Others</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* role field */}
                        <FormField name="role" control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>I am a</FormLabel>
                                    <FormControl>
                                        <select {...field} style={selectStyle}>
                                            <option value="user">Patient</option>
                                            <option value="doctor">Doctor</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* show only if doctor selected */}
                        {selectedRole === "doctor" && (
                            <FormField name="specialization" control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Specialization</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. Cardiologist, Dentist"
                                                style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* submit button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                background: isSubmitting ? "#99f6e4" : "linear-gradient(135deg, #0d9488, #06b6d4)",
                                color: "white",
                                fontWeight: 700,
                                width: "100%",
                                padding: "12px",
                                borderRadius: "12px",
                                border: "none",
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                transition: "opacity 0.2s",
                                marginTop: "8px"
                            }}
                            className="flex items-center justify-center gap-2 hover:opacity-90">
                            {isSubmitting ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Please wait</>
                            ) : (
                                <>
                                    <HeartPulse className="h-4 w-4" />
                                    Get Started
                                </>
                            )}
                        </button>

                    </form>
                </Form>

            </div>
        </div>
    )
}

export default infopage;