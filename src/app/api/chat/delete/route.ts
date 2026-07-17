import dbConnect from "@/src/lib/dbConnect";
import UserModel from "@/src/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/options";

export async function DELETE(request: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session || !session?.user) {
            return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");
        if (!sessionId) {
            return Response.json({ success: false, message: "sessionId is required." }, { status: 400 });
        }

        const userId = session.user._id!.toString();

        // Try to delete from HF — if endpoint not ready yet, we skip silently
        try {
            await fetch(`${process.env.HF_ENDPOINT}/chat/delete/${sessionId}`, {
                method: "DELETE",
                headers: { "x-user-id": userId },
            });
        } catch {
            // HF delete not implemented yet — continue anyway
            console.warn("HF delete not available yet, skipping.");
        }

        // Always remove from MongoDB regardless
        const user = await UserModel.findById(session.user._id);
        if (!user) {
            return Response.json({ success: false, message: "User not found." }, { status: 404 });
        }

        user.sessions = user.sessions.filter((s: any) => s.sessionId !== sessionId);
        await user.save();

        return Response.json({ success: true, message: "Session deleted." }, { status: 200 });

    } catch (error) {
        console.error("Error deleting session:", error);
        return Response.json({ success: false, message: "Internal server error." }, { status: 500 });
    }
}