import dbConnect from "@/src/lib/dbConnect";
import UserModel from "@/src/models/User";
import AppointmentModel from "@/src/models/Appointment";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import SlotModel from "@/src/models/Slot";
import NotificationModel from "@/src/models/Notification";
import { text } from "stream/consumers";

const CONSULTATION_FEE = 1;

export async function POST(request: Request){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if(!session || !session.user){
            return Response.json({
                success:false,
                message:"Unauthorized. Please sign in first."
            }, {status:401}
            )
        }

        if(session.user.role !== "user"){
            return Response.json({
                success:false,
                message:"Only users can book appointments."
            }, {status:403})
        }

        const {doctorId , slotId, date, timeSlot, typeOfAppointment,orderId} = await request.json();

        if(!doctorId || !slotId || !date || !timeSlot || !typeOfAppointment || !orderId){
            return Response.json({
                success:false,
                message:"All fields are required."
            }, {status:400})
        }

        const doctor = await UserModel.findById(doctorId);
        if(!doctor || doctor.role !== "doctor"){
            return Response.json({
                success:false,
                message:"Invalid doctor ID."
            }, {status:400})
        }

        const slot = await SlotModel.findById(slotId);
        if(!slot){
            return Response.json({
                success:false,
                message:"Invalid slot ID."
            }, {status:400})
        }

        if(slot.doctorId.toString() !== doctorId){
            return Response.json({
                success:false,
                message:"Slot does not belong to the specified doctor."
            }, {status:400})
        }

        const appointmentDate = new Date(date);
        const isDateBooked = slot.bookedDates?.some(
            (d:Date)=>new Date(d).toDateString() === appointmentDate.toDateString()
        );

        if(isDateBooked){
            return Response.json({
                success:false,
                message:"This slot is already booked for the selected date. Please choose another date or slot."
            }, {status:400})
        }

        const existingAppointment = await AppointmentModel.findOne({
            patentId: session.user._id,
            doctorId,
            date:appointmentDate,
            status: {$nin: ["cancelled"]}
        })

        if(existingAppointment){
            return Response.json({
                success:false,
                message:"You already have an appointment with this doctor on the selected date."
            }, {status:400})
        }

        const appointment = new AppointmentModel({
            patientId: session.user._id,
            doctorId,
            slotId,
            date : appointmentDate,
            timeSlot,
            typeOfAppointment,
            status:"pending",
            orderId,
            paymentStatus:"pending",
            amount:CONSULTATION_FEE,
        })

        await appointment.save();

        await SlotModel.findByIdAndUpdate(slotId,{
            $push:{bookedDates: appointmentDate}
        })

        await NotificationModel.create({
            userId: doctorId,
            text: `New appointment request from ${session.user.username} for ${date} at ${timeSlot}.`,
            type: "appointment",
        })

        await SlotModel.findByIdAndUpdate(slotId,{
            status:"booked"
        });

        return Response.json({
            success:true,
            message:"Appointment booked successfully and is pending confirmation from the doctor.",
            appointment
        },
        {status:200})
    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred while booking the appointment."
        }, {status:500})
    }
}