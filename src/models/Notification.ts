import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,  // who receives the notification
    },
    text: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["appointment", "cancel", "chat","paid","failed"],
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default NotificationModel;