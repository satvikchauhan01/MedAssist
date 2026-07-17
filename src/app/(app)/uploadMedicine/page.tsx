"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod"; 
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { medicineFormSchema, medicineSchema } from "@/src/schemas/medicineSchema";
import { Loader2, PlusCircle } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Form-specific schema: we omit imageUrl because the user uploads a File, 
// and the backend generates the URL string.
const formSchema = medicineSchema.omit({ imageUrl: true });

const UploadMedicine = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication & Authorization Guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signIn")
    }
    if (status === "authenticated" && session?.user?.role !== "doctor") {
      router.replace("/"); 
    }
  }, [status, session, router]);

  const form = useForm<z.infer<typeof medicineFormSchema>>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      image:undefined
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("price", data.price.toString());
      
      // Ensure the image exists in form state before appending
      if (data.image) {
        formData.append("image", data.image);
      } else {
        toast.error("Please select an image");
        setIsSubmitting(false);
        return;
      }

      const response = await axios.post("/api/uploadMedicines", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (response.data.success) {
        toast.success("Success", { description: response.data.message });
        router.push("/medicines");
      }
    } catch (error: any) {
      toast.error("Error", { 
        description: error.response?.data?.message || "Failed to upload medicine" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || !session || session.user?.role !== "doctor") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f0faf8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0d9488]" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen py-12"
      style={{ background: "#f0faf8", fontFamily: "Georgia, serif" }}>

      {/* Decorative Blobs */}
      <div style={{ background: "radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)" }}
        className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none" />
      <div style={{ background: "radial-gradient(circle, rgba(251,113,133,0.08) 0%, transparent 70%)" }}
        className="fixed bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none" />

      <div className="w-full max-w-xl p-8 space-y-6 relative z-10"
        style={{ background: "white", borderRadius: "24px", border: "1px solid #c9ebe4", boxShadow: "0 8px 40px rgba(13,148,136,0.08)" }}>

        {/* ── HEADER ── */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)" }} className="p-3 rounded-2xl">
              <PlusCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 style={{ color: "#0f4c3a", fontWeight: 800, lineHeight: 1.2 }}
            className="text-3xl mb-2">
            Add New{" "}
            <span style={{
              background: "linear-gradient(135deg, #0d9488, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Medicine
            </span>
          </h1>
          <p style={{ color: "#4a7c6f" }} className="text-sm">
            Fill in the details to list a new medicine in the directory.
          </p>
        </div>

        {/* ── FORM ── */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Medicine Name */}
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Medicine Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='e.g. Paracetamol 500mg'
                      style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price Field */}
              <FormField
                name="price"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Price (INR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        placeholder='0.00'
                        style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload Field */}
              <FormField
                name={"image" as any}
                control={form.control}
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Image Upload</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          {...rest}
                          //onChange={(e) => onChange(e.target.files?.[0])}
                          // only by this line react hook form state is not correctly upadated and when the onsubmit is being checked then the image field is always undefined
                          onChange={(e)=>{
                            const file = e.target.files?.[0];
                            if(file){
                                onChange(file);// update react hook form state
                            }
                          }}
                          style={{ borderColor: "#c9ebe4", color: "#0f4c3a" }}
                          className="cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description Field */}
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "#0f4c3a", fontWeight: 600 }}>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder='Dosage, usage, and precautions...'
                      style={{ borderColor: "#c9ebe4", color: "#0f4c3a", resize: "none" }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
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
              className="flex items-center justify-center gap-2 hover:opacity-90 mt-4 shadow-md">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : ("Register Medicine")}
            </button>

          </form>
        </Form>

        {/* ── BACK LINK ── */}
        <div className="text-center pt-2">
          <button 
            onClick={() => router.back()}
            style={{ color: "#4a7c6f" }} 
            className="text-sm hover:underline transition-all">
            ← Cancel and go back
          </button>
        </div>

      </div>
    </div>
  );
}

export default UploadMedicine;