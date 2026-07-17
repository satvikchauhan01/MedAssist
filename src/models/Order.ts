import mongoose,{Schema} from "mongoose";
import UserModel from "./User";

export interface Order extends Document{
    user:mongoose.Types.ObjectId;
    medicine:mongoose.Types.ObjectId;
    amount:number;
    razorpayOrderId:string;
    razorpayPaymentId:string;
    status:string;
    createdAt:Date;
}

const orderSchema = new Schema<Order>({
    user:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true,
    },
    medicine:{
        type:mongoose.Types.ObjectId,
        ref:"Medicine",
        required:true,
    },
    amount:{
        type:Number,
        required:true,
    },
    razorpayOrderId:{
        type:String,
        required:true,
    },
    razorpayPaymentId:{
        type:String,
        required:true,
    },
    status:{
        type:String,
        enum:["pending", "paid", "failed"],
        default:"pending",
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
});

const OrderModel = mongoose.models.Order || mongoose.model<Order>("Order",orderSchema);
export default OrderModel;