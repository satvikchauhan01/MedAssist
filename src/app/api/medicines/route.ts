import dbConnect from "@/src/lib/dbConnect";
import MedicineModel from "../../../models/Medicines";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/options";

export async function GET(request:Request){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session || !session.user){
            return NextResponse.json({
                success:false,
                message:"Unauthorized"
            }, {status:401})
        }
        const medicines = await MedicineModel.find({}).sort({ createdAt: -1 });
        return NextResponse.json({
            success: true,
            message: medicines.length === 0 ? "No medicines found" : "Medicines fetched successfully",
            data: medicines
        }, { status: 200 });

    } catch (error) {
        return  NextResponse.json({
            success:false,
            message:"Error fetching medicines"
        }, {status:500})
    }
}