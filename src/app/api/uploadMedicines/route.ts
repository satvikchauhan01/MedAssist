import dbConnect from "@/src/lib/dbConnect";
import MedicineModel from "../../../models/Medicines";
import { uploadImage } from "@/src/lib/cloudinary"; 
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
export async function POST(request:Request){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session || !session.user || session.user.role !== "doctor"){
            return Response.json({
                success:false,
                message:"Unauthorized"
            }, {status:401})
        }

        const formData = await request.formData();

        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const price = parseFloat(formData.get("price") as string);
        const image = formData.get("image") as File;

        if(!name || !description || !price || !image){
            return Response.json({
                success:false,
                message:"All fields are required"
            }, {status:400})
        }

        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const cloudinaryResponse:any = await uploadImage(buffer);

        if(!cloudinaryResponse || !cloudinaryResponse.secure_url){
            return Response.json({
                success:false,
                message:"Image upload failed"
            }, {status:500})
        }

        const newMedicine = new MedicineModel({
            name,
            description,
            price,
            imageUrl: cloudinaryResponse.secure_url,
        });

        await newMedicine.save();

        return Response.json({
            success:true,
            message:"Medicine added successfully"
        }, {status:201})

    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred while adding the medicine"
        }, {status:500})
    }
}