import UserModel from "@/src/models/User";
import dbConnect from "@/src/lib/dbConnect";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import crypto from "crypto";

export async function POST(request:Request){
    try {
        const session = await getServerSession(authOptions);
    
        if(!session || !session.user){
            return Response.json({
                success:false,
                message:"Unauthorized. Please sign in first."
            }, {status:401})
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = await request.json();

        if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature){
            return Response.json({
                success:false,
                message:"All payment details are required for verification."
            }, {status:400})
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest("hex");

        if(expectedSignature !== razorpay_signature){
            return Response.json({
                success:false,
                message:"Invalid payment signature."
            }, {status:400})
        }

        return Response.json({
            success:true,
            message:"Payment verified successfully.",
            paymentId:razorpay_payment_id,
        }, {status:200})

        
    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred while verifying the payment."
        }, {status:500})
    }
}