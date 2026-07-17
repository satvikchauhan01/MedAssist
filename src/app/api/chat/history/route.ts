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

        const hfResponse = await fetch(`${process.env.HF_ENDPOINT}/chat/history/${sessionId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": session.user._id!.toString(),
            },
        });

        if (!hfResponse.ok) {
            return Response.json({ success: false, message: "Failed to fetch history." }, { status: 500 });
        }

        const hfData = await hfResponse.json();

        return Response.json({
            success: true,
            sessionId: hfData.session_id,
            status: hfData.status,
            startedAt: hfData.started_at,
            endedAt: hfData.ended_at,
            finalDiagnosis: hfData.final_diagnosis,
            messages: hfData.messages,
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching history:", error);
        return Response.json({ success: false, message: "Internal server error." }, { status: 500 });
    }
}