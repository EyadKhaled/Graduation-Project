import { verifyAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";

/**
 * protect – requires a valid Bearer access token
 */
export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer "))
      return res.status(401).json({ message: "Not authenticated. Please log in." });

    const token = auth.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User no longer exists." });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ message: "Access token expired.", code: "TOKEN_EXPIRED" });
    return res.status(401).json({ message: "Invalid token." });
  }
};

/**
 * requireVerified – must have confirmed email
 */
export const requireVerified = (req, res, next) => {
  if (!req.user.isVerified)
    return res.status(403).json({ message: "Please verify your email first." });
  next();
};
