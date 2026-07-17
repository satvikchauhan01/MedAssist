import dbConnect from "@/src/lib/dbConnect";
import SlotModel from "@/src/models/Slot";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";

export async function DELETE(request:Request){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if(!session || !session.user){
            return Response.json({
                success:false,
                message:"Unauthorized. Please sign in first."
            }, {status:401})
        }

        if(session.user.role !== "doctor"){
            return Response.json({
                success:false,
                message:"Only doctors can remove time slots."
            }, {status:403})
        }

        const {searchParams} = new URL(request.url);
        const slotId = searchParams.get("slotId");

        if(!slotId){
            return Response.json({
                success:false,
                message:"SlotId is required."
            },{status:400})
        }

        const slot = await SlotModel.findById({
            slotId
        })

        if(!slot){
            return Response.json({
                success:false,
                message:"The desired slot to be deleted is not found."
            },{status:404})
        }

        if(slot.doctorId.toString() !== session.user._id){
            return Response.json({
                success:false,
                message:"You are not authorized to delete these slots."
            },{status:403})
        }

        const today = new Date();
        const hasUpcomingBookings = slot.bookedDates?.some(
            (d:Date) =>new Date(d) >= today
        )

        if(hasUpcomingBookings){
            return Response.json({
                success:false,
                message:"Slots with upcoming bookings cannot be deleted."
            },{status:400})
        }

        await SlotModel.findByIdAndDelete(slotId);

        return Response.json({
            success:true,
            message:"Slot deleted successfully"
        },{status:200})

    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred while removing the slot."
        }, {status:500});
    }
}