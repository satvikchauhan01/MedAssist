    import {sendVerificationEmail} from "@/src/helpers/sendVerificationEmail";
    import dbConnect from "@/src/lib/dbConnect";
    import UserModel from '@/src/models/User'
    import bcrypt from "bcryptjs";

    export async function POST(request:Request){

        try {
            await dbConnect();
            const {username , email , password , authProvider } = await request.json();
            if ( !username || !email || !authProvider) {
                return Response.json(
                { success: false, message: "All fields are required." },
                { status: 400 }
                );
            }
            if (authProvider === "credentials") {
                if (!password) {
                return Response.json({ success:false, message:"Password required." },{status:400})
                }
            }

            // if (authProvider === "google") {
            //     const existingUser = await UserModel.findOne({ email });
            //     if (existingUser) {
            //         return Response.json({ success:true, message:"Login successful" },{status:200});
            //     }

            //     const existingUsername = await UserModel.findOne({ username });
            //         if (existingUsername) {
            //         return Response.json({ success:false, message:"Username already taken." },{status:400})
            //     }
            //     const newUser = new UserModel({
            //         username,
            //         email,
            //         isVerified: true,
            //         authProvider: "google"
            //     });
            //     await newUser.save();
            //     return Response.json({ success:true, message:"Google signup successful" },{status:200});
            // }


            const existingUserByUsername = await UserModel.findOne({
                username,
            })

            if(existingUserByUsername){
                return Response.json({
                    success:false,
                    message:"Username is already taken."
                },{status:400})
            }

            const existingUserByEmail = await UserModel.findOne({
                email, 
            })

            if(existingUserByEmail){
                if (existingUserByEmail.authProvider !== authProvider) {
                return Response.json({
                success:false,
                message:`Account already registered with ${existingUserByEmail.authProvider}.`
                },{status:400})
            }
            }

            const verifyCode = Math.floor(100000 + Math.random()*900000).toString();

            if(existingUserByEmail){
                // if user exists then we need to update the verify code and expiry
                if(existingUserByEmail.isVerified){
                    return Response.json({
                        success:false,
                        message: "User already exists with this email and is verified."
                    },{status:400})
                }
                else{   // user is not verified , so we can update the verify code and expiry and password too
                    const hashedPassword = await bcrypt.hash(password,10);
                    existingUserByEmail.password = hashedPassword;
                    existingUserByEmail.verifyCode = verifyCode;
                    existingUserByEmail.verifyCodeExpiry = new Date(Date.now()+3600000);
                    existingUserByEmail.username = username;
                    existingUserByEmail.authProvider = authProvider;

                    await existingUserByEmail.save();
                }

            }else{  // user does not exist , so create a new user
                const hashedPassword = await bcrypt.hash(password,10);
                // now in UserModel we also had a verifycodeexpiry so set it 

                const expiryDate = new Date();  // new Date is current date and time  // new gives date object
                expiryDate.setHours(expiryDate.getHours()+1); // 1 hour from now

                const newUser = new UserModel({
                    username,
                    email,
                    password: hashedPassword,
                    verifyCode,
                    verifyCodeExpiry : expiryDate,
                    isVerified: false,
                    authProvider: authProvider,
                })

                await newUser.save();
            }

            // send verification email

            const emailResponse = await sendVerificationEmail(
                email,
                username,
                verifyCode
            )

            // console.log("Sending verification email to:", email);
            // console.log("Verification code:", verifyCode);

            if(!emailResponse.success){
                return Response.json({
                    success:false,
                    message: emailResponse.message
                },{status:500})
            }

            return Response.json({
                    success: true,
                    message: "User registered successfully. Verification email sent."
                },{status:200}
            )


        } catch (error) {
            console.error("Error registering user:",error);
            return Response.json({
                success:false,
                message:"Error registering user."
            },
            {
                status:500
            }
            )
        }
    }