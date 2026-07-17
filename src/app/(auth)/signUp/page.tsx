  'use client'
  import { zodResolver } from "@hookform/resolvers/zod"
  import { useForm } from "react-hook-form"
  import * as z from "zod"
  import Link from "next/link"
  import { useEffect, useState } from "react"
  import { useDebounceCallback } from 'usehooks-ts'
  import { toast } from "sonner"
  import { useRouter } from "next/navigation"
  import { signUpSchema } from "@/src/schemas/signUpSchema"
  import axios, { AxiosError } from "axios"
  import { ApiResponse } from "@/src/types/ApiResponse"
  import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form"
  import { Input } from "@/components/ui/input"
  import { Loader2, HeartPulse } from "lucide-react"
  import { signIn } from "next-auth/react"


  // if we check username availability on every keystroke, it will make too many API calls and can cause performance issues. So we will use debounce to limit the number of API calls made while checking username availability.
  //  Debounce will delay the API call until the user has stopped typing for a certain amount of time (e.g., 500 milliseconds). This way, we can check username availability only when the user has finished typing, rather than on every keystroke.
  const page = () => {
    const [username, setUsername] = useState(""); //  By default username is empty string
    const [usernameMessage, setUsernameMessage] = useState("") // state to store message related to username available or not 
    const [isCheckingUsername, setIsCheckingUsername] = useState(false) // state to indicate whether we are currently checking username availability
    const [isSubmitting, setIsSubmitting] = useState(false) // state to indicate whether the form is currently being submitted

    const debounced = useDebounceCallback(setUsername, 300)  // 300 is the dealy time of cheking 
    const router = useRouter();

    // zod implementation for form validation
    const form = useForm<z.infer<typeof signUpSchema>>({
      resolver: zodResolver(signUpSchema), // validation schema for form validation using zod
      defaultValues: {
        username: "",
        email: "",
        password: "",
      }
    })

    useEffect(() => {
      const checkUsernameUnique = async () => {
        if (username.trim() !== "") {
          setIsCheckingUsername(true);
          setUsernameMessage("");
          try {
            const response = await axios.get(`/api/check-username-unique?username=${username}`);
            console.log("checking response", response);
            //let message = response.data.message;  and give this message to setUsernameMessage
            setUsernameMessage(response.data.message)
          } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            setUsernameMessage(
              axiosError.response?.data.message ?? "Error checking username"
            )
          } finally {
            setIsCheckingUsername(false);
          }
        }
      }
      checkUsernameUnique();
    }, [username]) // username ke change hone pe hi checkUsernameUnique function call hoga

    const onSubmit = async (data: z.infer<typeof signUpSchema>) => {  // onSubmit me data milta h jo handleSubmit se aata h form se
      setIsSubmitting(true);
      console.log("form data", data);
      try {
        const response = await axios.post('/api/signUp', {
          ...data,
          authProvider: "credentials" // kyuki hum credentials ke through signup kar rahe hai, google ke through nhi kar rahe hai isliye authProvider me credentials pass karna hoga taki backend me pata chal sake ki user kis tarah se signup kar raha hai
        });

        // response check karna padega ki hua bhi hai ya nhi 
        if (response.data.success) {  //  bug fix: success check added
          toast.success(
            "Success",
            { description: response.data.message },
          )
          router.replace(`/verify/${data.username}`) // ek new page bana ke us page pe redirect karna hai jaha pe user apna email verify kar sake, url se username le lenge 
        } else {
          toast.error("Signup failed", { description: response.data.message })
        }

        setIsSubmitting(false);
      } catch (error) {
        console.error("Error in sig nup of user", error);
        const axiosError = error as AxiosError<ApiResponse>;
        const errorMessage = axiosError.response?.data.message
        toast.error(
          "Signup failed",
          { description: errorMessage },
          // {variant: "destructive"}
        )
        setIsSubmitting(false);
      }
    }

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
            <h1 style={{ color: "#0f4c3a", fontWeight: 800, lineHeight: 1.2 }} className="text-3xl mb-2">
              Sign Up to{" "}
              <span style={{
                background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                MedAssist
              </span>
            </h1>
            <p style={{ color: "#4a7c6f" }} className="text-sm">
              Signup to start your journey with MedAssist
            </p>
          </div>

          {/* ── FORM ── */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* username field */}
              <FormField
                name="username"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='username'
                        style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
                        onChange={(e) => {
                          field.onChange(e); // react hook form ke field onChange ko call karna hoga taki form state update ho sake
                          debounced(e.target.value);
                        }}
                      />
                    </FormControl>
                    {/* username checking loader */}
                    {isCheckingUsername && <Loader2 className="animate-spin h-4 w-4" style={{ color: "#0d9488" }} />}
                    {/* username availability message */}
                    <p className={`text-sm font-medium ${usernameMessage === "Username is available" ? 'text-green-600' : 'text-red-500'}`}>
                      {usernameMessage}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* email field */}
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Email</FormLabel>
                    <FormControl>
                      {/* username me liya tha becasue we want to check username availability but email me aisa nhi hai isliye email placeholder me email likha h */}
                      <Input {...field} placeholder='email'
                        style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
                      />
                    </FormControl>
                    <p style={{ color: "#4a7c6f" }} className='text-sm'>We will send you a verification code</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* password field */}
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Password</FormLabel>
                    <FormControl>
                      {/* username me liya tha becasue we want to check username availability but email me aisa nhi hai isliye email placeholder me email likha h */}
                      <Input {...field} placeholder='password' type='password'
                        style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                  </>
                ) : ("Sign Up")}
              </button>

            </form>
          </Form>

          {/* ── DIVIDER ── */}
          <div className="flex items-center gap-3">
            <div style={{ height: "1px", background: "#c9ebe4", flex: 1 }} />
            <span style={{ color: "#4a7c6f" }} className="text-xs">or continue with</span>
            <div style={{ height: "1px", background: "#c9ebe4", flex: 1 }} />
          </div>

          {/* google sign up button */}
          <button
            type="button"
            onClick={() => signIn("google", {
              callbackUrl: '/Home'  
            })}
            style={{ border: "1.5px solid #c9ebe4", color: "#0f4c3a", fontWeight: 600, background: "white", width: "100%", padding: "11px", borderRadius: "12px", cursor: "pointer" }}
            className="flex items-center justify-center gap-3 hover:opacity-80 transition-opacity">
            {/* Google icon */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          {/* ── SIGN IN LINK ── */}
          <div className="text-center">
            <p style={{ color: "#4a7c6f" }} className="text-sm">
              Already a member?{" "}
              <Link href='/signIn'
                style={{ color: "#0d9488", fontWeight: 700 }}
                className="hover:opacity-80 transition-opacity">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    )
  }

  export default page