import dbConnect from "@/src/lib/dbConnect";
import AppointmentModel from "@/src/models/Appointment";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";

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

        if(session.user.role !== "user"){
            return Response.json({
                success:false,
                message:"Only patients can access this list."
            }, {status:403})
        }

        //fetching all appointments of this user across all doctoors and all time slots
        const appointments = await AppointmentModel.find({
            patientId:session.user._id
        })
        .populate("doctorId","name specialization")
        .populate("slotId","from day to ")
        .sort({date:1})

        return Response.json({
            success:true,
            message:"Appointments fetched successfully.",
            appointments
        }, {status:200});

    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred while retrieving appointments."
        }, {status:500})   
    }
}   