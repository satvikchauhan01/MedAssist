import dbConnect from "@/src/lib/dbConnect";
import UserModel from "@/src/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";

export async function GET(request: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return Response.json({
                success: false,
                message: "Unauthorized. Please sign in first."
            }, { status: 401 })
        }

        // only patients can fetch doctor list
        if (session.user.role !== "user") {
            return Response.json({
                success: false,
                message: "Only patients can access this."
            }, { status: 403 })
        }

        // fetch all verified doctors
        const doctors = await UserModel.find({
            role: "doctor",
            isVerified: true,
            name: { $exists: true, $ne: "" }  // only doctors who filled info
        }).select("name specialization username")  // only send necessary fields

        return Response.json({
            success: true,
            message: "Doctors fetched successfully.",
            doctors,
        }, { status: 200 })

    } catch (error) {
        return Response.json({
            success: false,
            message: "An error occurred while fetching doctors."
        }, { status: 500 })
    }
}