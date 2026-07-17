import { resend } from "../lib/resend";
import VerificationEmail from "@/emails/VerificationEmail";
import { ApiResponse } from "../types/ApiResponse";

export async function sendVerificationEmail(
    email:string,
    username:string,
    otp :string   //otp yha sayad define kara h....User model me verify code h iska name..recheck once 
): Promise<ApiResponse>{   // async function always returns a promise
    
    try {
        await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: email,
      subject: 'Verification Code for Your Account',
      react: VerificationEmail({ username, otp }),
    });

    // console.log("Email function triggered");

        return{
            success:true,
            message:"Verification email sent successfully."
        }
    } catch (emailError) {
        console.error("Error sending verification email:",emailError);
        return{
            success:false,
            message:"Failed to send verification email."
        }
    }

}