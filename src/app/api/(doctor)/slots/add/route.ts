import dbConnect from "@/src/lib/dbConnect";
import SlotModel from "@/src/models/Slot";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";      
import { success } from "zod";
import { stat } from "fs";

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

        if(session.user.role !== "doctor"){
            return Response.json({
                success:false,
                message:"Only doctors can add time slots."
            }, {status:403})
        }

        const { from, to, day } = await request.json();

        if(!from || !to || !day){
            return Response.json({
                success:false,
                message:"Day , to , from,  fields are required."
            }, {status:400})
        }   

        const allowedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        if(!allowedDays.includes(day)){
            return Response.json({
                success:false,
                message:"Invalid day. Allowed values are: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday."
            }, {status:400})
        }
        
        const existingSlot = await SlotModel.findOne({
            doctorId:session.user._id,
            day,
            status:"available",
            $or:[
                {
                    from:{$lte:to}, // just mongoDb checking by or , is there any free slot available
                    to:{$gte:from}
                }
            ]
        })

        if(existingSlot){
            return Response.json({
                success:false,
                message:"This time slot overlaps with an existing slot."
            }, {status:400})
        }

        const Slot = await SlotModel.create({
            doctorId:session.user._id,
            day,
            from,
            to,
            status:"available"
        })

        return Response.json({
            success:true,
            message:"Slot added successfully.",
            data:Slot
        }, {status:201})


    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred while adding the slot."
        }, {status:500});   
    }
}