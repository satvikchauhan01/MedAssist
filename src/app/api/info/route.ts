import dbConnect from "@/src/lib/dbConnect";
import UserModel from "@/src/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function POST(request: Request) {
    try {
        await dbConnect();

        // get current logged in user from session
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return Response.json({
                success: false,
                message: "Unauthorized. Please sign in first."
            }, { status: 401 })
        }

        const { name, age, weight, gender, role, specialization } = await request.json();

        if (!name || !gender || !role) {
            return Response.json({
                success: false,
                message: "Name, gender, and role are required."
            }, { status: 400 })
        }

        if (role === "doctor" && !specialization) {
            return Response.json({ success: false, message: "Specialization is required for doctors." }, { status: 400 })
        }

        const user = await UserModel.findById(session.user._id);

        if (!user) {
            return Response.json({
                success: false,
                message: "User not found."
            }, { status: 404 })
        }

        // update the fields
        user.name = name;
        user.age = age;
        user.weight = weight;
        user.gender = gender;
        user.role = role;
        user.specialization = specialization;

        await user.save();

        return Response.json({
            success: true,
            message: "Information updated successfully.",
            role: role
        }, { status: 200 })

    } catch (error) {
        console.error("Error updating user info:", error);
        return Response.json({
            success: false,
            message: "An error occurred while updating information."
        }, { status: 500 })
    }
}