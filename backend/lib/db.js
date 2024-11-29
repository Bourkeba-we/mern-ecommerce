import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to mongoDB: ${error.message}`);
    process.exit(1);
  }
};

// mongodb://localhost:27017
// mongodb+srv://root:root1234@cluster0.m6cq9.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0
