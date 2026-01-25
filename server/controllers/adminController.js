/**
 * Admin Controller
 * Handles administrative authentication
 */

import jwt from "jsonwebtoken";

/**
 * Authenticates admin user with username and password
 * Issues JWT token on successful authentication
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.username - Admin username
 * @param {string} req.body.password - Admin password
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with JWT token or error
 */
export const adminLogin = (req, res) => {
    const { username, password } = req.body;

    if (
        username !== process.env.ADMIN_USERNAME ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ role: "admin" }, process.env.ADMIN_JWT_SECRET, {
        expiresIn: "12h",
    });

    res.json({ token });
};
