// middleware/adminAuth.js
import jwt from "jsonwebtoken";

export const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check for admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied: Admins only" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("Admin JWT verification failed:", err);
    return res.status(403).json({ error: "Invalid or expired admin token" });
  }
};
