'use client'

import { useParams, useRouter } from 'next/navigation'
import { toast } from "sonner"
// when we have to recieve dynamic data then we have to make a dynamic route like this [username] and in page.tsx we can access the username from the url 
import React from 'react'
import { useForm } from 'react-hook-form'
import * as z from "zod";
import { verifySchema } from '@/src/schemas/verifySchema'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { ApiResponse } from '@/src/types/ApiResponse'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { HeartPulse, Loader2, MailCheck } from 'lucide-react'
import { useState } from 'react'

const VerifyAccount = () => {
    const router = useRouter();
    const params = useParams<{ username: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // validation schema for form validation using zod
    const form = useForm<z.infer<typeof verifySchema>>({
        resolver: zodResolver(verifySchema),
        defaultValues: {
            code: "",
        },
    })

    const onSubmit = async (data: z.infer<typeof verifySchema>) => {
        setIsSubmitting(true);
        try {
            const response = await axios.post('/api/verify-code', {
                username: params.username,
                code: data.code
            })
            if (response.data.success) {
                toast.success("Success", { description: response.data.message });
                router.replace('/info');
            } else {
                toast.error("Error", { description: response.data.message });
            }
        } catch (error) {
            console.error("Error in signup of user", error);
            const axiosError = error as AxiosError<ApiResponse>;
            let errorMessage = axiosError.response?.data.message
            toast.error(
                "Verification failed",
                { description: errorMessage },
                // {variant: "destructive"}
            )
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className='flex justify-center items-center min-h-screen'
            style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>

            {/* decorative blobs */}
            <div style={{ background: "radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)" }}
                className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none" />
            <div style={{ background: "radial-gradient(circle, rgba(251,113,133,0.08) 0%, transparent 70%)" }}
                className="fixed bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none" />

            <div className='w-full max-w-md p-8 space-y-6 relative z-10'
                style={{ background: "white", borderRadius: "24px", border: "1px solid #c9ebe4", boxShadow: "0 8px 40px rgba(13,148,136,0.08)" }}>

                {/* ── LOGO + HEADER ── */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }} className="p-3 rounded-2xl">
                            <MailCheck className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 style={{ color: "#0f4c3a", fontWeight: 800, lineHeight: 1.2 }} className="text-3xl mb-2">
                        Verify your{" "}
                        <span style={{
                            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            Account
                        </span>
                    </h1>
                    <p style={{ color: "#4a7c6f" }} className="text-sm">
                        Enter the verification code sent to your email
                    </p>

                    {/* showing which username is being verified */}
                    <div style={{ background: "#ccfbf1", border: "1px solid #c9ebe4" }}
                        className="mt-4 px-4 py-2 rounded-xl inline-block">
                        <span style={{ color: "#0d9488", fontWeight: 600 }} className="text-sm">
                            @{params.username}
                        </span>
                    </div>
                </div>

                {/* ── FORM ── */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>
                                        Verification Code
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter 6-digit code"
                                            {...field}
                                            style={{ borderColor: "#c9ebe4", color: "#0f4c3a", letterSpacing: "4px", fontSize: "18px", textAlign: "center" }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                transition: "opacity 0.2s"
                            }}
                            className="flex items-center justify-center gap-2 hover:opacity-90">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                                </>
                            ) : ("Verify Account")}
                        </button>

                    </form>
                </Form>

                {/* resend code hint */}
                <p style={{ color: "#4a7c6f" }} className="text-center text-xs">
                    Didn't receive a code? Check your spam folder or try signing up again.
                </p>

            </div>
        </div>
    )
}

export default VerifyAccount