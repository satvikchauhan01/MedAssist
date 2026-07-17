import dbConnect from "@/src/lib/dbConnect";
import AppointmentModel from "@/src/models/Appointment";
import SlotModel from "@/src/models/Slot";
import NotificationModel from "@/src/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function PUT(request: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return Response.json({
                success: false,
                message: "Unauthorized."
            }, { status: 401 })
        }

        // only patients can use this route
        if (session.user.role !== "user") {
            return Response.json({
                success: false,
                message: "Only patients can cancel via this route."
            }, { status: 403 })
        }

        const { appointmentId } = await request.json();

        if (!appointmentId) {
            return Response.json({
                success: false,
                message: "Appointment ID is required."
            }, { status: 400 })
        }

        const appointment = await AppointmentModel.findById(appointmentId);
        if (!appointment) {
            return Response.json({
                success: false,
                message: "Appointment not found."
            }, { status: 404 })
        }

        // make sure this appointment belongs to this patient
        if (appointment.patientId.toString() !== session.user._id) {
            return Response.json({
                success: false,
                message: "Not authorized to cancel this appointment."
            }, { status: 403 })
        }

        // only pending appointments can be cancelled by patient
        if (appointment.status !== "pending") {
            return Response.json({
                success: false,
                message: `Cannot cancel a ${appointment.status} appointment.`
            }, { status: 400 })
        }

        // cancel appointment
        appointment.status = "cancelled";
        await appointment.save();

        // free up the slot date
        await SlotModel.findByIdAndUpdate(appointment.slotId, {
            $pull: { bookedDates: appointment.date }
        });

        // notify doctor about cancellation
        await NotificationModel.create({
            userId: appointment.doctorId,
            text: `Patient cancelled their appointment on ${new Date(appointment.date).toLocaleDateString()}.`,
            type: "cancel",
        });

        return Response.json({
            success: true,
            message: "Appointment cancelled successfully.",
        }, { status: 200 })

    } catch (error) {
        console.error("Error cancelling appointment:", error);
        return Response.json({
            success: false,
            message: "Failed to cancel appointment."
        }, { status: 500 })
    }
}