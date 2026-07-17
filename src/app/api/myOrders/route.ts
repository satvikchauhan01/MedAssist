import dbConnect from "@/src/lib/dbConnect";
import OrderModel from "@/src/models/Order";
import "@/src/models/Medicines";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import "@/src/models/Medicines"; 

export async function GET(request: Request) {
    try {
        await dbConnect();
        
        // Ensure user is authenticated
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized. Please sign in first."
            }, { status: 401 });
        }

        // Fetch orders matching user's ID, populate details, sort by newest first
        const orders = await OrderModel.find({ user: session.user._id })
            .populate("medicine")
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            message: "Orders retrieved successfully",
            data: orders
        }, { status: 200 });
        
    } catch (error: any) {
        console.error("Fetch Orders API Error:", error);
        return NextResponse.json({
            success: false,
            message: "An error occurred while compiling your purchase history."
        }, { status: 500 });
    }
}