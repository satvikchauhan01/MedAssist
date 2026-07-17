import dbConnect from "@/src/lib/dbConnect";
import UserModel from "@/src/models/User";
import { z } from "zod";
import { usernameValidation } from "@/src/schemas/signUpSchema";

const UsernameQuerySchema = z.object({   // we have to make a query schema like this to validate the query params
    username:usernameValidation   // import this schecma anad form the queryschema
})

export async function GET(request:Request){

    // if(request.method !== "GET"){
    //     return Response.json({
    //         success:false,
    //         message:"Method not allowed",
    //     },{status:405})
    // }      // not now used in new versions
    
    // localhost:3000/api/check-username-unique?username=abhiii?phone=android .... this can be the url format, from which we need to extract the username
    try {
        await dbConnect();
        const {searchParams}  = new URL(request.url);  // url me se username nikalna se api ke baad ki saari cheeze nikalna 
        const queryParam = {    // this is the object to be validated , or the format u can say
            username: searchParams.get("username") || ""
        }
        // validate with zod

        const result = UsernameQuerySchema.safeParse(queryParam);

        // console.log("Result of username validation:", result);  // remove it later 

        if(!result.success){
            const usernameErrors = result.error.format().username?._errors || [];
            return Response.json({
                success:false,
                message:"Invalid username",
            },
        {status:400})
        }

        const normalizedUsername = result.data.username
                .trim()
                .toLowerCase();

        const existingVerifiedUser = await UserModel.findOne({
            username:normalizedUsername,
        })

        if(existingVerifiedUser){
            return Response.json({
                success:false,
                message:"Username is already taken "
            },{status:400})
        }

        return Response.json({
                success:true,
                message:"Username is available"
            },{status:200})

    } catch (error) {
        console.error("Error checking username uniqueness:", error);
        return Response.json({
            success:false,
            message:"Error checking username uniqueness"
        },
    {status:500})
    }
}