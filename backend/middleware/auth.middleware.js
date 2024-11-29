import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No access token provided" });
    }

    try {
      const { userId } = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET
      );

      const user = await User.findById(userId).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user;

      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Unauthorized - Access token expired" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(401).json({ message: "Unauthorized - Invalid access token" });
  }
};

export const adminRoute = (req, res, next) => {
  try {
    if (req.user && req.user.role === "admin") {
      return next();
    } else {
      res.status(403).json({ message: "Forbidden - Admin access only" });
    }
  } catch (error) {
    console.error("Error in adminRoute middleware:", error.message);
    res.status(401).json({ message: "Unauthorized - Invalid access token" });
  }
};
