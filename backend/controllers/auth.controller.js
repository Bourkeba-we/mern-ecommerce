import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  ); // 7d
};

const setCookie = async (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // prevent access from javascript
    sameSite: "strict",
    secure: true,
    maxAge: 15 * 60 * 1000, // 15m
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // prevent access from javascript
    sameSite: "strict",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });
};

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({ email, password, name });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    await setCookie(res, accessToken, refreshToken);

    res.status(201).json({
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error in signup controller: ", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid Email" });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    await setCookie(res, accessToken, refreshToken);

    res.status(200).json({
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Logged in successfully",
    });
  } catch (error) {
    console.error("Error in Login controller: ", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const { userId } = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      await redis.del(`refresh_token:${userId}`);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// this will refresh the access token
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token provided" });
    }

    const { userId } = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const token = await redis.get(`refresh_token:${userId}`);

    if (refreshToken !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true, // prevent access from javascript
      sameSite: "strict",
      secure: true,
      maxAge: 15 * 60 * 1000, // 15m
    });

    res.status(200).json({ message: "Refreshed access token successfully" });
  } catch (error) {
    console.error("Error in refresh token controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error("Error in getProfile controller: ", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
