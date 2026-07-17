import dbConnect from "@/src/lib/dbConnect";
import NotificationModel from "@/src/models/Notification";
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

        // fetch latest 10 notifications for this user
        const notifications = await NotificationModel.find({
            userId: session.user._id
        })
        .sort({ createdAt: -1 })  // latest first
        .limit(10)

        return Response.json({
            success: true,
            message: "Notifications fetched.",
            notifications,
        }, { status: 200 })

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error fetching notifications."
        }, { status: 500 })
    }
}