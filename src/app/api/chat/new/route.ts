import dbConnect from "@/src/lib/dbConnect";
import UserModel from "@/src/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/options";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session ||!session?.user) {
            return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
        }

        const user = await UserModel.findById(session.user._id);
        if (!user) {
            return Response.json({ success: false, message: "User not found." }, { status: 404 });
        }

        // Key check — is this user's very first session ever?
        const isFirstSession = user.sessions.length === 0;

        const sessionId = uuidv4();
        const chatNumber = user.sessions.length + 1;

        user.sessions.push({
            sessionId,
            title: `Chat ${chatNumber}`,
            createdAt: new Date(),
        });
        await user.save();

        return Response.json({
            success: true,
            sessionId,
            isFirstSession,   // frontend uses this to decide whether to show profile form
        }, { status: 200 });

    } catch (error) {
        console.error("Error creating session:", error);
        return Response.json({ success: false, message: "Internal server error." }, { status: 500 });
    }
}