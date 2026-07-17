'use client'
import { Suspense, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from "zod";
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema } from '@/src/schemas/signInSchema'
import { useRouter } from 'next/navigation';
import { FormField, FormControl, Form, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { toast } from "sonner"
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, HeartPulse } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

const SignInContent = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    console.log("error from URL:", error);
    if (error) {
      setTimeout(() => {
        toast.error(decodeURIComponent(error));
      }, 100);
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: ""
    }
  })

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        identifier: data.identifier,
        password: data.password,
        // callbackUrl: "/Home"  // directly setting this true was the error which was forcing without checking the cookies 
      });

      //
      if (result?.error) {
        toast.error(result.error, { description: "Login Error" });
        return;
      }

      if (result?.ok) {
        // hard redirect — cookie is fully set before middleware runs
        // middleware then reads token.role correctly
        // doctor → redirected to /doctor/dashboard by middleware 
        // patient → stays on /Home
        // router.replace("/Home")  +++++ this hard redirect is not suitable 
        window.location.href = "/Home";  
      }

      /*router.replace("/Home")
      → client side navigation (instant)
      → cookie may not be fully saved yet
      → middleware reads empty token → no role 

      window.location.href = "/Home"
      → full page reload
      → browser waits, sends all cookies
      → middleware reads token.role = "doctor" 
      → redirects to /doctor/dashboard 
      */
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen"
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
              <HeartPulse className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 style={{ color: "#0f4c3a", fontWeight: 800, lineHeight: 1.2 }}
            className="text-3xl mb-2">
            Sign In to{" "}
            <span style={{
              background: "linear-gradient(135deg, #0d9488, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              MedAssist
            </span>
          </h1>
          <p style={{ color: "#4a7c6f" }} className="text-sm">
            Sign in to start your journey with MedAssist
          </p>
        </div>

        {/* ── FORM ── */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <FormField
              name="identifier"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>
                    Username or Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='Enter username or email'
                      style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='Enter your password'
                      type='password'
                      style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* credentials sign in button */}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Please wait
                </>
              ) : ("Sign In")}
            </button>

          </form>
        </Form>

        {/* ── DIVIDER ── */}
        <div className="flex items-center gap-3">
          <div style={{ height: "1px", background: "#c9ebe4", flex: 1 }} />
          <span style={{ color: "#4a7c6f" }} className="text-xs">or continue with</span>
          <div style={{ height: "1px", background: "#c9ebe4", flex: 1 }} />
        </div>

        {/* google sign in button */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/Home" })}  
          style={{ border: "1.5px solid #c9ebe4", color: "#0f4c3a", fontWeight: 600, background: "white", width: "100%", padding: "11px", borderRadius: "12px", cursor: "pointer" }}
          className="flex items-center justify-center gap-3 hover:opacity-80 transition-opacity">
          {/* Google icon */}
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* ── SIGN UP LINK ── */}
        <div className="text-center">
          <p style={{ color: "#4a7c6f" }} className="text-sm">
            Not a member?{" "}
            <Link href='/signUp'
              style={{ color: "#0d9488", fontWeight: 700 }}
              className="hover:opacity-80 transition-opacity">
              Sign Up
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

// wrap in Suspense to fix prerender error
const page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}

export default page