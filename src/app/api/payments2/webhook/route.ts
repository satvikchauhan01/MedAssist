// this part is needed so that in case of any failure in the network or any other issue , the browser was
// unable to tell server that money is paid
// webhook is a server-to-server call . Razorpay's server will ping our server directly , bypassing user's browser entirely 
// webhook logic looks like below
// 1. Our server recieves the ping from Razorpay
// 2 . We verify that the ping actually came from Razorpay(usig a secret header )
// 3. we check the event type : payment.captured or payment.failed
// 4. depending upon that we update our Database

import Razorpay from "razorpay";
import crypto from "crypto";
import dbConnect from "../../../../lib/dbConnect";
import NotificationModel from "@/src/models/Notification"
import OrderModel from "@/src/models/Order";

export async function POST(request:Request){
    try {
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature");

        if(!signature){
            return Response.json({
                success:false,
                message:"Signature missing."
            }, {status:400})
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
            .update(body)
            .digest("hex");

        if(signature !== expectedSignature){
            return Response.json({
                success:false,
                message:"Invalid signature."
            }, {status:400})
        }

        const event = JSON.parse(body);
        await dbConnect();

        if(event.event === "payment.captured"){
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;
            const paymentId = payment.id;

            const Order = await OrderModel.findOne({razorpayOrderId :orderId});

            if(Order && Order.status !== "failed"){
                Order.status = "paid";
                Order.razorpayPaymentId = paymentId;
                await Order.save();

                await NotificationModel.create({
                    userId:Order.user,
                    message:"You have successfully purchased a medicine.",
                    type:"paid",
                });
            }
        }

        else if(event.event === "payment.failed"){
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;
            const paymentId = payment.id

            const Order = await OrderModel.findOne({razorpayOrderId :orderId});
            if(Order && Order.status === "pending"){
                Order.status = "failed";
                await Order.save();

                await NotificationModel.create({
                    userId:Order.user,
                    message:"Your payment for medicine purchase failed.",
                    type:"failed",
                });
            }
        }

        return Response.json({
            success:true,
            message:"Webhook processed successfully."
        }, {status:200})
    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred while processing the webhook."
        }, {status:500})
    }
}