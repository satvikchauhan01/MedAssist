import dbConnect from "@/src/lib/dbConnect";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import UserModel from "@/src/models/User";
import { success } from "zod";

const CONSULTATION_FEE = 1;

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export async function POST(request:Request){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
    
        if(!session || !session.user){
            return Response.json({
                success:false,
                message:"Unauthorized. Please sign in first."
            }, {status:401})
        }
        const {doctorId} = await request.json();
        if(!doctorId){
            return Response.json({
                success:false,
                message:"DoctorId is required to book an appointment."
            }, {status:400})
        }
    
        const doctor = await UserModel.findById(doctorId);
        if(!doctor || doctor.role !== "doctor"){
            return Response.json({
                success:false,
                message:"The provided doctorId is invalid."
            }, {status:400})
        }
    
        //creating razorpay order 
        const order = await razorpay.orders.create({
            amount: CONSULTATION_FEE * 100, // amount in paise
            currency:"INR",
            receipt:`receipt_${Date.now()}`,
            notes:{
                doctorId,
                patientId:session.user._id as string,
            }
        })
    
        return Response.json({
            success:true,
            message:"Order created successfully.",
            orderId:order.id,
            amount:order.amount,
            currency:order.currency
        },{status:200})
    } catch (error) {
        return Response.json({
            success:false,
            message:"Failed to create payment order."
        }, {status:500})
    }

}