"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Calendar, CheckCircle2, XCircle, Clock, ShoppingBag , Pill } from "lucide-react";
import { toast } from "sonner";

interface MedicineDetails {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface Order {
  _id: string;
  medicine: MedicineDetails;
  amount: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

const MyOrdersPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Guard Page Access
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signIn");
    }
  }, [status, router]);

  // Fetch Order Ledger Data
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("/api/myOrders");
        if (response.data.success) {
          setOrders(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching patient orders:", error);
        toast.error("Failed to sync your orders history.");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status]);

  // Status Badge Helper
  const getStatusBadge = (orderStatus: string) => {
    switch (orderStatus) {
      case "paid":
        return (
          <span className="flex items-center gap-1.5 bg-[#e6f4f1] text-[#0d9488] px-3 py-1 rounded-full text-xs font-bold capitalize">
            <CheckCircle2 className="h-3.5 w-3.5" /> Successful
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold capitalize">
            <XCircle className="h-3.5 w-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold capitalize">
            <Clock className="h-3.5 w-3.5" /> Pending
          </span>
        );
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f0faf8]">
        <Loader2 className="h-10 w-10 animate-spin text-[#0d9488]" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen py-12 px-6 bg-[#f0faf8]" style={{ fontFamily: "Georgia, serif" }}>
      
      {/* MedAssist Fluid Decorative Blobs */}
      <div style={{ background: "radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)" }}
        className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none" />
      <div style={{ background: "radial-gradient(circle, rgba(251,113,133,0.08) 0%, transparent 70%)" }}
        className="fixed bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        
        {/* ── HEADER BLOCK ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#0f4c3a]">My Medical Orders</h1>
            <p className="text-[#4a7c6f] mt-2">View status, receipt details, and order tracking logs.</p>
          </div>
          <div className="p-3 bg-white rounded-2xl shadow-md border border-[#c9ebe4]">
            <Package className="h-8 w-8 text-[#0d9488]" />
          </div>
        </div>

        {/* ── DYNAMIC RENDERING (EMPTY vs DATA MAP) ── */}
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[24px] border border-[#c9ebe4] shadow-sm p-8 space-y-4 max-w-xl mx-auto">
            <div className="flex justify-center">
              <div className="p-4 bg-[#f0faf8] text-[#0d9488] rounded-full">
                <ShoppingBag className="h-12 w-12" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#0f4c3a]">No orders found yet</h3>
            <p className="text-[#4a7c6f] text-sm max-w-sm mx-auto">
              Your pharmaceutical purchase cabinet is completely empty. When you purchase prescription items, they will appear securely logged here.
            </p>
            <button
              onClick={() => router.push("/medicines")}
              className="mt-2 px-6 py-2.5 bg-gradient-to-r from-[#0d9488] to-[#06b6d4] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity"
            >
              Browse Medicine Catalog
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-[24px] border border-[#c9ebe4] p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition-shadow"
              >
                {/* Product Image Panel */}
                <div className="h-28 w-28 rounded-2xl bg-gray-50 border border-[#e2f3f0] overflow-hidden flex-shrink-0">
                  {order.medicine?.imageUrl ? (
                    <img
                      src={order.medicine.imageUrl}
                      alt={order.medicine?.name || "Medicine"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Pill className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Main Purchase Summary Specifications */}
                <div className="flex-1 space-y-2 w-full text-center md:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="text-2xl font-bold text-[#0f4c3a]">
                      {order.medicine?.name || "Unknown Medicine Catalog Item"}
                    </h2>
                    <div className="flex justify-center">{getStatusBadge(order.status)}</div>
                  </div>
                  
                  <p className="text-[#4a7c6f] text-sm line-clamp-1">
                    {order.medicine?.description || "No item description metadata cached."}
                  </p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 pt-2 border-t border-dashed border-[#e2f3f0] text-xs text-[#4a7c6f]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-[#0d9488]" />
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </div>
                    <div>
                      <span className="font-semibold text-[#0f4c3a]">Order ID: </span>
                      <span className="font-mono">{order.razorpayOrderId}</span>
                    </div>
                    {order.razorpayPaymentId && (
                      <div>
                        <span className="font-semibold text-[#0f4c3a]">Txn ID: </span>
                        <span className="font-mono text-gray-500">{order.razorpayPaymentId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side Pricing Block */}
                <div className="w-full md:w-auto md:border-l md:border-[#e2f3f0] md:pl-6 text-center flex-shrink-0">
                  <span className="text-xs font-semibold text-[#4a7c6f] uppercase tracking-wider block">Total Amount</span>
                  <span className="text-3xl font-extrabold text-[#0f4c3a] block mt-1">
                    ₹{order.amount}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Catalog Navigation Link Footer */}
        {orders.length > 0 && (
          <div className="text-center">
            <button 
              onClick={() => router.push("/medicines")}
              className="text-sm font-semibold text-[#0d9488] hover:underline transition-all"
            >
              ← Back to Pharmacy Catalog
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyOrdersPage;