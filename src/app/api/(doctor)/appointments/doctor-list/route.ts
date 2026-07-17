import UserModel from "@/src/models/User";
import AppointmentModel from "@/src/models/Appointment";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import dbConnect from "@/src/lib/dbConnect";

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

        if(session.user.role !== "doctor"){
            return Response.json({
                success:false,
                message:"Only doctors can access this list."
            }, {status:403})
        }

        const appointments = await AppointmentModel.find({
            doctorId:session.user._id
        }) // populate --> retrieve all necessary detials without needing multiple queries from frontend
        .populate("patientId","name age gender weight") // fetch patient name ...etc
        .populate("slotId","from day to ")  // fetch slot details 
        .sort({date:1}) // sort by date in ascending order

        return Response.json({
            success:true,
            message:"Appointments fetched successfully.",
            appointments
        }, {status:200});

    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred while retrieving appointments."
        }, {status:500});
    }
}