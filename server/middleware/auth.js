import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
