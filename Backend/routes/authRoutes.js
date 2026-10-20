import express from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";

import jwt from "jsonwebtoken";

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long."
            });
        }

        // 2. Check if email already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
            [email.trim()]
        );

        if (existingUser.rowCount > 0) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        // 3. Hash the password
        const passwordHash = await bcrypt.hash(password, 12);

        // 4. Save user in PostgreSQL
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, created_at`,
            [name.trim(), email.trim().toLowerCase(), passwordHash]
        );

        // 5. Send response without password or hash
        return res.status(201).json({
            message: "Registration successful!",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Registration failed:", error.message);

        return res.status(500).json({
            message: "Something went wrong during registration."
        });
    }
});




router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        // 2. Find the user by email
        const result = await pool.query(
            "SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)",
            [email.trim()]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

        // 3. Compare entered password with stored bcrypt hash
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // 4. Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        // 5. Return token and safe user details
        return res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login failed:", error.message);

        return res.status(500).json({
            message: "Something went wrong during login."
        });
    }
});


export default router;
