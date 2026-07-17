import crypto from 'crypto';
import dbConnect from '@/src/lib/dbConnect';
import AppointmentModel from '@/src/models/Appointment';
import SlotModel from '@/src/models/Slot';
import NotificationModel from '@/src/models/Notification';

export async function POST(request:Request){
    try {
        const body = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if(!signature){
            return Response.json({
                success: false,
                message: "Signature missing."
            }, { status: 400 }
            )
        }

        const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest('hex');

        if(signature !== expectedSignature){
            return Response.json({
                success: false,
                message: "Invalid signature."
            }, { status: 400 }
            )
        }

        const event = JSON.parse(body);

        await dbConnect();

        if(event.event === "payment.captured"){
            const payment = event.payload.payment.entity
            const orderId = payment.order_id;
            const paymentId = payment.id;

            const appointment = await AppointmentModel.findOne({orderId:orderId});

            if(appointment && appointment.status !== "cancelled"){
                appointment.status = "paid";
                appointment.paymentId = paymentId;
                await appointment.save();

                // notify doctor about the new appointment payment received
                await NotificationModel.create({
                    userId:appointment.doctorId,
                    message:"Payment received for appointment.",
                    type:"appointment",
                })
            }
        }

        else if(event.event === "payment.failed"){
            const payment = event.payload.payment.entity
            const orderId = payment.order_id;

            const appointment = await AppointmentModel.findOne({ orderId: orderId });

            if(appointment){
                appointment.paymentStatus = "failed";
                appointment.status = "cancelled";
                await appointment.save();

                // free up the booked slot for other patients to book
                await SlotModel.findByIdAndUpdate(appointment.slotId, {
                    $pull: { bookedDates: appointment.date },
                })

                await NotificationModel.create({
                    userId:appointment.patientId,
                    message:"Payment failed for appointment.",
                    type:"cancel",
                })
            }
        }   
    } catch (error) {
        console.error("Error processing Razorpay webhook:", error);
        return Response.json({
            success:true,
            message:"An error occurred while processing the webhook."
        }, { status:200 });
        // 200 response to prevent Razorpay from retrying the webhook in case of errors
    }
}