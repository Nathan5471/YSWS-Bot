import mongoose from "mongoose";

const yswsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true },
  guid: { type: String, required: true, unique: true },
  pubDate: { type: Date, required: true },
  description: { type: String, required: true },
});

const YSWS = mongoose.model("YSWS", yswsSchema);

export interface YSWSType extends mongoose.Document {
  title: string;
  link: string;
  guid: string;
  pubDate: Date;
  description: string;
}

export default YSWS;
