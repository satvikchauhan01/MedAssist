import dbConnect from "@/src/lib/dbConnect";
import UserModel from "@/src/models/User";
import bcrypt from 'bcryptjs';

export async function POST(request:Request){
    
    try {
        await dbConnect();
        const { username , password } = await request.json();
        if(!username || !password ){
            return Response.json({
                success:false,
                message:"Username and password are required"
            },{status:400})
        }

        const user = await UserModel.findOne({
            username:username
        })

        if(!user){
            return Response.json({
                success:false,
                message:"Invalid username or password"
            },{status:401})
        }

        if(!user.isVerified){
            return Response.json({
                success:false,
                message:"Please verify your email before signing in"
            },{status:401})
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return Response.json({
                success:false,
                message:"Invalid password"
            },{status:401})
        }

        return Response.json({
            success:true,
            message:"Sign in successful"
        },{status:200})

    } catch (error) {
        return Response.json({
            success:false,
            message:"An error occurred during sign in"
        },{status:500})
    }
}