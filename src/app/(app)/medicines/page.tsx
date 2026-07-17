"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Pill, Router, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Medicine{
  _id:string;
  name:string;
  description:string;
  price:Number;
  imageUrl:string;
}

const MedicinesPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [medicines, selectMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  // const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  //  here useEffect is telling React , that once this component is mounted on the screen , go and grab Razorpay payment tools 
  useEffect(()=>{
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js"; // download razorpay payment tools from here 
    script.async = true;
    document.body.appendChild(script);
    return ()=>{  // in react return statement is for cleanup , so when this component is removed from the screen , remove the razorpay payment tools as well
      document.body.removeChild(script);
    }
  },[])

  useEffect(()=>{
    if(status === "unauthenticated"){
      router.replace("/signin"); // if user is not signed in then redirect them to signin page
    }
  },[status])

  
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await axios.get("/api/medicines"); // We'll need this API next
        if (response.data.success) {
          selectMedicines(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch medicines", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, []);
  
  if(!session) return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f0faf8]">
        <Loader2 className="h-10 w-10 animate-spin text-[#0d9488]" />
      </div>
    );
  }

  // if(!medicines){

  // }

  const handleMedicineSelect = (med: Medicine) => {
    // Implementation for handling medicine selection
    selectMedicines(medicines);
  };


  const buyMedicine = async(selectedMedicine : Medicine)=>{
    setIsBooking(true);
    try {
      const orderResponse = await axios.post("/api/payments2/create-order", { medicineId: selectedMedicine._id });
      const orderData = orderResponse.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!, // Razorpay key from environment variables
        amount: orderData.amount, // amount in paise
        currency: "INR",
        name:"MedAssist",
        description: `Purchase of ${selectedMedicine.name}`,
        order_id: orderData.orderId,

        handler: async (response :any)=>{
          try {
            // Verifyin on Server
            const verifyResponse = await axios.post("/api/payments2/verify",{
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              medicineId: selectedMedicine._id,
              amountPaid: orderData.amount,
            });

            if(verifyResponse.data.success){
              toast.success("Medicine purchased successfully!");
              selectMedicines([]);
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            toast.success("Payment received! Medicine purchase will be confirmed shortly.");
          }
          setIsBooking(false);
        },

        prefill:{
          name: session.user?.name || "",
          email: session.user?.email || "",
        },
        theme:{
          color:"#0d9488"
        },

        modal: {
          // FIXES the "stuck on initializing payment" bug when user closes modal
          ondismiss: () => {
            toast.error("Payment cancelled. Order was not processed.");
            setIsBooking(false); // Unlocks the "Buy Now" button instantly
          }
        }
        
      }

      const paymentWindow = new (window as any).Razorpay(options);
      paymentWindow.open();

    } catch (error) {
      toast.error("Failed to create payment order.");
    }
  }

  return (
    <div className="min-h-screen py-12 px-6 bg-[#f0faf8]" style={{ fontFamily: "Georgia, serif" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-[#0f4c3a]">Available Medicines</h1>
            <p className="text-[#4a7c6f] mt-2">Browse our verified pharmaceutical directory</p>
          </div>
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#c9ebe4]">
            <Pill className="h-8 w-8 text-[#0d9488]" />
          </div>
        </div>

        {medicines.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#c9ebe4]">
            <p className="text-[#4a7c6f]">No medicines found. Start by uploading one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {medicines.map((med: any) => (
              <div 
                key={med._id} 
                className="bg-white rounded-3xl overflow-hidden border border-[#c9ebe4] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-48 w-full relative bg-gray-100">
                  <img 
                    src={med.imageUrl} 
                    alt={med.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-[#0f4c3a]">{med.name}</h3>
                    <span className="bg-[#e6f4f1] text-[#0d9488] px-3 py-1 rounded-full text-sm font-bold">
                      ₹{med.price}
                    </span>
                  </div>
                  <p className="text-[#4a7c6f] text-sm line-clamp-2 mb-6">
                    {med.description}
                  </p>
                  <button 
                    onClick={() => buyMedicine(med)} // ─── ADD THIS WIRE HERE ───
                    disabled={isBooking}             // Prevents double clicks while loading
                    className="w-full py-3 bg-gradient-to-r from-[#0d9488] to-[#06b6d4] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <ShoppingCart className="h-4 w-4" /> 
                    {isBooking ? "Initializing payment..." : "Buy Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicinesPage;