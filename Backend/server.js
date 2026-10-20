import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import pool from "./db.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import gmailRoutes from "./routes/gmailRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import emailCategoryRoutes from "./routes/emailCategoryRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Smart Email Organizer backend is running!"
    });
});

// Database health check
app.get("/api/health/db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Database connected successfully!",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// Test protected route
app.get("/api/auth-test", authMiddleware, (req, res) => {
    res.json({
        message: "Authentication successful!",
        userId: req.user.userId
    });
});

// API routes
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/gmail", gmailRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/email-categories", emailCategoryRoutes);
app.use("/api/ai", aiRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


