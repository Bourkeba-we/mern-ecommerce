import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    products: [
      {
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    stripeSessionId: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
