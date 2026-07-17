import mongoose,{Schema} from "mongoose";

const slotSchema = new Schema({
    doctorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    from:{
        type:String,
        required:true,
    },
    to:{
        type:String,
        required:true,
    },
    day:{
        type:String,
        enum:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        required:true,
    },
    status:{
        type:String,
        enum:["available","booked"],
        default:"available",
    },
    // for which specific date dates are booked 
    bookedDates:[{
        type:Date,
    }],
    createdAt:{
        type:Date,
        default:Date.now,
    }
})

const SlotModel = mongoose.models.Slot || mongoose.model("Slot", slotSchema);

export default SlotModel;