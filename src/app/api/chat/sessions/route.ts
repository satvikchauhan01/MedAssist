import dbConnect from "@/src/lib/dbConnect";
import UserModel from "@/src/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/options";

export async function GET(request: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
        }

        const user = await UserModel.findById(session.user._id);
        if (!user) {
            return Response.json({ success: false, message: "User not found." }, { status: 404 });
        }

        const sessions = user.sessions.sort(
            (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return Response.json({ success: true, sessions }, { status: 200 });

    } catch (error) {
        console.error("Error fetching sessions:", error);
        return Response.json({ success: false, message: "Internal server error." }, { status: 500 });
    }
}