import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
  try {
    const productIds = req.user.cartItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) => cartItem.product.toString() === product._id.toString()
      );
      return { ...product.toJSON(), quantity: item.quantity };
    });

    res.status(200).json({ cartItems, message: "Cart items fetched" });
  } catch (error) {
    console.error("Error in getCartProducts controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push({ product: productId });
    }

    await user.save();

    res
      .status(201)
      .json({ cartItems: user.cartItems, message: "Product added to cart" });
  } catch (error) {
    console.error("Error in addToCart controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter(
        (item) => item.product.toString() !== productId
      );
    }

    await user.save();
    res
      .status(200)
      .json({ cartItems: user.cartItems, message: "Cart is cleared" });
  } catch (error) {
    console.error("Error in removeAllFromCart controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter(
          (item) => item.product.toString() !== productId
        ); // remove the product from the cart
        await user.save();
        return res
          .status(200)
          .json({ cartItems: user.cartItems, message: "Product removed" });
      }

      existingItem.quantity = quantity;
      await user.save();
      return res
        .status(200)
        .json({ cartItems: user.cartItems, message: "Cart updated" });
    }

    return res.status(400).json({ message: "Product not found in cart" });
  } catch (error) {
    console.error("Error in updateQuantity controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
