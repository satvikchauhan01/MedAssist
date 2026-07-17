import dbConnect from "@/src/lib/dbConnect";
import AppointmentModel from "@/src/models/Appointment";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET(request: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return Response.json({
                success: false,
                message: "Unauthorized."
            }, { status: 401 })
        }

        if (session.user.role !== "doctor") {
            return Response.json({
                success: false,
                message: "Only doctors can access this."
            }, { status: 403 })
        }

        // get all completed appointments for this doctor
        const completedAppointments = await AppointmentModel.find({
            doctorId: session.user._id,
            status: "completed"
        })
        .populate("patientId", "name age gender")
        .sort({ date: -1 })  // latest first

        // group by patientId to get unique patients
        // and count interactions per patient
        const patientMap = new Map();

        completedAppointments.forEach(apt => {
            const patientId = apt.patientId._id.toString();
            if (patientMap.has(patientId)) {
                // patient already exists — increment interactions
                patientMap.get(patientId).interactions += 1;
            } else {
                // new patient — add to map
                patientMap.set(patientId, {
                    patientId: apt.patientId._id,
                    name: apt.patientId.name,
                    age: apt.patientId.age,
                    lastInteraction: apt.date,
                    interactions: 1,
                })
            }
        })

        // convert map to array
        const pastPatients = Array.from(patientMap.values());

        return Response.json({
            success: true,
            message: "Past patients fetched.",
            pastPatients,
        }, { status: 200 })

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error fetching past patients."
        }, { status: 500 })
    }
}