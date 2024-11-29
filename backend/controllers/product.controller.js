import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});

    if (!products) {
      res.status(404).json({ message: "No products found" });
    }

    res.status(201).json({ products });
  } catch (error) {
    console.error("Error in getFeaturedProducts controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.status(200).json({ products: JSON.parse(featuredProducts) });
    }

    // .lean() returns a plain JavaScript object instead of a Mongoose document\
    // better performance
    featuredProducts = await Product.find({ isFeatured: true }).lean();

    if (!featuredProducts) {
      res.status(404).json({ message: "No featured products found" });
    }

    await redis.set("featured_products", JSON.stringify(featuredProducts));

    res.status(201).json({ products: featuredProducts });
  } catch (error) {
    console.error("Error in getFeaturedProducts controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image } = req.body;

    const requiredFields = { name, description, price, category, image };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res
          .status(400)
          .json({ message: `Product ${field} is required` });
      }
    }

    let cloudinaryResponse = null;

    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image: cloudinaryResponse.secure_url || "",
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error("Error in createProduct controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0]; // get the public id of the image

      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (error) {
        console.error("Error deleting image from Cloudinary: ", error.message);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProduct controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 4 } },
      { $project: { _id: 1, name: 1, description: 1, price: 1, image: 1 } },
    ]);

    res.status(200).json({ products });
  } catch (error) {
    console.error(
      "Error in getRecommendedProducts controller: ",
      error.message
    );
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });

    if (!products) {
      res.status(404).json({ message: "No products found" });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error in getProductsByCategory controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isFeatured = !product.isFeatured;

    const updatedProduct = await product.save();

    await updatedFeatureProductsCache();

    res.status(200).json({
      product: updatedProduct,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error in toggleFeaturedProduct controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

async function updatedFeatureProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();

    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.error("Error updating featured products cache: ", error.message);
  }
}
