import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/options";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session?.user) {
            return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");
        if (!sessionId) {
            return Response.json({ success: false, message: "sessionId is required." }, { status: 400 });
        }

        const hfResponse = await fetch(`${process.env.HF_ENDPOINT}/chat/report/${sessionId}`, {
            method: "GET",
            headers: { "x-user-id": session.user._id!.toString() },
        });

        if (!hfResponse.ok) {
            return Response.json({ success: false, message: "Failed to fetch report." }, { status: 500 });
        }

        const hfData = await hfResponse.json();
        return Response.json({ success: true, report: hfData }, { status: 200 });

    } catch (error) {
        console.error("Error fetching report:", error);
        return Response.json({ success: false, message: "Internal server error." }, { status: 500 });
    }
}