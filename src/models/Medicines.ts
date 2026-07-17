import mongoose,{Schema} from "mongoose";

const medicineSchema = new Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    imageUrl:{
        type:String,
        required:true,
    }
}, { timestamps: true });

const MedicineModel = mongoose.models.Medicine || mongoose.model("Medicine",medicineSchema);
export default MedicineModel;