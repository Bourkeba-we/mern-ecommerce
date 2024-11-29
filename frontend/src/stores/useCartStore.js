import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subTotal: 0,
  isCouponApplied: false,

  getMyCoupon: async () => {
    try {
      const response = await axios.get("/coupons");
      set({ coupon: response.data });
    } catch (error) {
      console.error("Error fetching coupon:", error);
    }
  },

  applyCoupon: async (code) => {
    try {
      const response = await axios.post("/coupons/validate", { code });
      set({ coupon: response.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    }
  },

  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  getCartItems: async () => {
    try {
      const { data } = await axios.get("/cart");
      set({ cart: data.cartItems });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      toast.error(error.response.data.error);
      console.error("error in getCartItems: ", error.response.data.error);
    }
  },

  addToCart: async (product) => {
    try {
      await axios.post("/cart", { productId: product._id });

      toast.success("Product added to cart");

      set((state) => {
        const existingItem = state.cart.find(
          (item) => item._id === product._id
        );
        const newCart = existingItem
          ? state.cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...state.cart, { ...product, quantity: 1 }];

        return { cart: newCart };
      });

      get().calculateTotals();
    } catch (error) {
      toast.error(error.response.data.error || "Error adding product to cart");
      console.error("error in addToCart: ", error.response.data.error);
    }
  },

  removeFromCart: async (productId) => {
    try {
      await axios.delete(`/cart`, { data: { productId } });

      toast.success("Product removed from cart");

      set((state) => {
        const newCart = state.cart.filter((item) => item._id !== productId);
        return { cart: newCart };
      });

      get().calculateTotals();
    } catch (error) {
      toast.error(
        error.response.data.error || "Error removing product from cart"
      );
      console.error("error in removeFromCart: ", error.response.data.error);
    }
  },

  updateQuantity: async (productId, quantity) => {
    try {
      if (quantity === 0) {
        get().removeFromCart(productId);
        return;
      }

      await axios.put("/cart/" + productId, { quantity });

      set((state) => {
        const newCart = state.cart.map((item) =>
          item._id === productId ? { ...item, quantity } : item
        );
        return { cart: newCart };
      });

      get().calculateTotals();
    } catch (error) {
      toast.error(
        error.response.data.error || "Error updating product quantity"
      );
      console.error("error in updateQuantity: ", error.response.data.error);
    }
  },

  calculateTotals: () => {
    const { cart, coupon } = get();

    const subTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const total = coupon
      ? subTotal - (subTotal * coupon.discountPercentage) / 100
      : subTotal;

    set({ subTotal, total });
  },

  clearCart: async () => {
    set({
      cart: [],
      coupon: null,
      total: 0,
      subTotal: 0,
      isCouponApplied: false,
    });
    get().removeFromCart();
  },
}));
