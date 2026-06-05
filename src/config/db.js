import mongoose from "mongoose";

export async function connectDb(uri) {
  await mongoose.connect(uri);
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
}
