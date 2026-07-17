import mongoose,{Schema} from "mongoose";


const sessionSchema = new Schema({
    sessionId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        default: "New Chat",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    messagesSent: {          
        type: Number,
        default: 0,
    }
})

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, 
    },
    password: {
        type: String,
        required: function () {
        return this.authProvider === "credentials";
        },
    },
    isVerified:{
        type:Boolean,
        default:false,
    },
    verifyCodeExpiry:{
        type:Date,
    },
    verifyCode:{
        type:String,
    },
    name:{
        type:String,
    },
    age:{
        type:Number,
    },
    weight:{
        type:Number,
    },
    gender:{
        type:String,
        enum:["male", "female", "other"],
        default:"male",
    },
    role: {
        type: String,
        enum: ["user", "doctor"],
        default: "user"
    },
    specialization: {
        type: String
    },
    sessions: {
        type: [sessionSchema],  
        default: []
    },
    authProvider:{
        type:String,
        enum:["credentials","google"],
        required:true,
    },
})


const UserModel =  mongoose.models.User || mongoose.model('User', userSchema);

export default UserModel;