import dbConnect from "@/src/lib/dbConnect";
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

        // mark all notifications as read for this user
        await NotificationModel.updateMany(
            { userId: session.user._id, isRead: false },
            { isRead: true }
        )

        return Response.json({
            success: true,
            message: "Notifications marked as read.",
        }, { status: 200 })

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error marking notifications."
        }, { status: 500 })
    }
}