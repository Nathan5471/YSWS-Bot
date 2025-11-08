import { channel } from "diagnostics_channel";
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  pastSent: { type: Boolean, default: false },
});

const Notification = mongoose.model("Notification", notificationSchema);

export interface NotificationType extends mongoose.Document {
  guildId: string;
  channelId: string;
  pastSent: boolean;
}

export default Notification;
