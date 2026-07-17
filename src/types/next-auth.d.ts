import 'next-auth'
import { DefaultSession } from 'next-auth';


// This file only tells typescript that “Hey, NextAuth’s User, Session, and JWT objects in my app contain extra fields. Please stop yelling at me.”
declare module 'next-auth'{   // want to ADD fields to the existing next-auth module types.
    interface User{
        _id? : string;
        isVerified?:boolean;
        // isAcceptingMessage?:boolean;
        isNewUser?: boolean;
        username?:string;
        role?: string;   
        specialization?: string;
    }
    interface Session{
        user:{
            _id? : string;
            isVerified?:boolean;
            isNewUser?: boolean;  
            username?:string;
            role?: string;
            specialization?: string;
        } & DefaultSession['user']
    }
}

declare module 'next-auth/jwt'{
    interface JWT{
        _id? : string;
        isVerified?:boolean;
        isNewUser?: boolean;
        username?:string;
        role?: string;
        specialization?: string;
    }
}