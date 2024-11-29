import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { create } from "zustand";

export const useProductStore = create((set) => ({
  products: [],
  loading: false,
  setProducts: (products) => set({ products }),

  createProduct: async (productData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/products", productData);

      set((state) => ({
        products: [...state.products, res.data.product],
        loading: false,
      }));
      toast.success("Product created successfully");
    } catch (error) {
      toast.error(error.response.data.error);
      console.error("error creating a product", error.response.data.error);
      set({ loading: false });
    }
  },

  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/products");
      set({ products: res.data?.products, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.error || "Error fetching products");
      console.error("error fetching products", error.response.data.error);
    }
  },

  fetchProductsByCategory: async (category) => {
    set({ loading: true });
    try {
      const res = await axios.get(`/products/category/${category}`);
      set({ products: res.data.products, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.error || "Error fetching products");
      console.error("error fetching products", error.response.data.error);
    }
  },

  toggleFeaturedProduct: async (productId) => {
    set({ loading: true });
    try {
      const res = await axios.patch(`/products/${productId}`);

      // this will update the product in the products array
      set((state) => {
        const updatedProducts = state.products.map((product) =>
          product._id === productId ? res.data.product : product
        );
        return { products: updatedProducts, loading: false };
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response.data.error);
      console.error(
        "error toggling featured product",
        error.response.data.error
      );
      set({ loading: false });
    }
  },

  deleteProduct: async (productId) => {
    set({ loading: true });
    try {
      const res = await axios.delete(`/products/${productId}`);

      set((state) => ({
        products: state.products.filter((product) => product._id !== productId),
        loading: false,
      }));
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response.data.error);
      console.error("error deleting product", error.response.data.error);
      set({ loading: false });
    }
  },

  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products/featured");
      set({ products: response.data.products, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      console.error("Error fetching featured products:", error);
    }
  },
}));
