import dbConnect from "@/src/lib/dbConnect";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import MedicineModel from "../../../../models/Medicines";

const razorpay = new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID!,
    key_secret:process.env.RAZORPAY_KEY_SECRET!
})

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

        const {medicineId} = await request.json();
        if(!medicineId){
            return Response.json({
                success:false,
                message:"MedicineId is required to buy a medicine."
            }, {status:400})
        }

        const medicine = await MedicineModel.findById(medicineId);
        if(!medicine){
            return Response.json({
                success:false,
                message:"The provided medicineId is invalid."
            }, {status:400})
        }

        const order = await razorpay.orders.create({
            amount:medicine.price * 100,
            currency:"INR",
            receipt:`receipt_${Date.now()}`,
            notes:{
                medicineId,
                userId:session.user._id as string,
            }
        })

        return Response.json({
            success:true,
            message:"Order created successfully.",
            orderId:order.id,
            amount:order.amount,
        },{status:200})
        
    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred while creating the order."
        }, {status:500})
    }
}