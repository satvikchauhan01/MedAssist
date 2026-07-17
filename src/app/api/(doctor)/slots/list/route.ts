import dbConnect from "@/src/lib/dbConnect";
import SlotModel from "@/src/models/Slot";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";

// we will get the doctorId from the URL , because the user and doctor can both fetch the
// slots , so taking the ID from the session will be a problem  

export async function GET(request:Request){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if(!session || !session.user){
            return Response.json({
                success:false,
                message:"Unauthorized. Please sign in first."
            }, {status:401})
        }

        const {searchParams} = new URL(request.url)
        const doctorId = searchParams.get("doctorId");
        const dateParam = searchParams.get("date"); // optional
        // mandatorly send the doctorID in the url 

        if(session.user.role === "doctor"){
            // doctor is fetching for his own slots 
            const doctorId = session.user._id;
            const slots = await SlotModel.find({
                doctorId})
                .sort({day:1, from:1}) //  sort from day then time

            return Response.json({
                success:true,
                slots,
                message:"Slots fetched successfully,"
            }, {status:200})
        }

        else if(session.user.role==="user"){

            if(!doctorId){
                return Response.json({
                    success:false,
                    message:"The doctorId for fetching the slot is required."
                },{status:400})
            }

            const slots = await SlotModel.find({
                doctorId,
                status:"available", // because the patients can see only the available slots 
            })
            .sort({day:1,from:1})

            // ── if date provided, filter out slots booked on that date ──
            if (dateParam) {
                const selectedDate = new Date(dateParam);
                const availableSlots = slots.filter(slot => {
                    // check if this specific date is in bookedDates
                    const isBooked = slot.bookedDates?.some(
                        (d: Date) => new Date(d).toDateString() === selectedDate.toDateString()
                    );
                    return !isBooked; // return slots NOT booked on this date
                });

                return Response.json({
                    success: true,
                    message: "Available slots fetched.",
                    slots: availableSlots,
                }, { status: 200 })
            }

            return Response.json({
                success:true,
                slots,
                message:"The available slots fetched successfully"
            },{status:200})
        }

    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred while fetching the slots."
        }, {status:500});
    }
}