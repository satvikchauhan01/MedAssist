import dbConnect from "@/src/lib/dbConnect";
import UserModel from "@/src/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/options";

export async function POST(request: Request) {
    try {
        // 🔧 FIX 5: Guard against missing HF_ENDPOINT env var early
        if (!process.env.HF_ENDPOINT) {
            throw new Error("HF_ENDPOINT environment variable is not set.");
        }

        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
        }

        const { sessionId, message } = await request.json();

        // 🔧 FIX 4: Reject whitespace-only or non-string messages
        if (!sessionId || typeof message !== "string" || !message.trim()) {
            return Response.json({ success: false, message: "sessionId and message are required." }, { status: 400 });
        }

        const user = await UserModel.findById(session.user._id);
        if (!user) {
            return Response.json({ success: false, message: "User not found." }, { status: 404 });
        }

        // Derive everything from MongoDB — no trust in frontend
        const userSession = user.sessions.find((s: any) => s.sessionId === sessionId);
        if (!userSession) {
            return Response.json({ success: false, message: "Session not found or does not belong to you." }, { status: 403 });
        }

        const isFirstMessage = userSession.messagesSent === 0;

        // 🔧 FIX 3: isFirstSession should mean "this is the user's very first message ever"
        // not just "they only have one session" — check total messages across all sessions
        const totalMessagesSent = user.sessions.reduce(
            (sum: number, s: any) => sum + (s.messagesSent ?? 0), 0
        );
        const isFirstEverMessage = totalMessagesSent === 0;

        // console.log(isFirstMessage, isFirstEverMessage);

        const userId = session.user._id!.toString();
        const hfHeaders = {
            "Content-Type": "application/json",
            "x-user-id": userId,
        };

        let hfResponse;

        if (isFirstMessage) {
        hfResponse = await fetch(`${process.env.HF_ENDPOINT}/chat/start`, {
            method: "POST",
            headers: hfHeaders,
            body: JSON.stringify({
                message,
                patient_name: isFirstEverMessage ? (user.name ?? null) : null,
                age: isFirstEverMessage ? (user.age != null ? String(user.age) : null) : null,       // ✅ number → string
                sex: isFirstEverMessage ? (user.gender ?? null) : null,
                weight: isFirstEverMessage ? (user.weight != null ? String(user.weight) : null) : null, // ✅ number → string
            }),
        });
        } else {
            hfResponse = await fetch(`${process.env.HF_ENDPOINT}/chat/continue`, {
                method: "POST",
                headers: hfHeaders,
                body: JSON.stringify({
                    session_id: sessionId,
                    message,
                }),
            });
        }

        // console.log("HF response status:", hfResponse.status);
        // console.log("HF response ", hfResponse);

        if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            console.error("HF error:", errorText);
            return Response.json({ success: false, message: "Failed to get response from chatbot." }, { status: 500 });
        }

        const hfData = await hfResponse.json();

        // 🔧 FIX 1: Sync the HF session_id back into MongoDB after /chat/start
        // HF generates its own session_id — we must store it so /chat/continue works
        if (isFirstMessage && hfData.session_id) {
            userSession.sessionId = hfData.session_id;
        }

        // Increment messagesSent only after confirmed success
        userSession.messagesSent = (userSession.messagesSent ?? 0) + 1;
        await user.save();

        return Response.json({
            success: true,
            sessionId: hfData.session_id,
            reply: hfData.message,
            stage: hfData.stage,
            status: hfData.status,
            data: hfData.data ?? null,
        }, { status: 200 });

    } catch (error) {
        // console.error("Error sending message:", error);
        return Response.json({ success: false, message: "Internal server error in getting response ." }, { status: 500 });
    }
}