
import express from "express";
import dotenv from "dotenv";
import { classifyEmail } from "./classifier.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json({ limit: "100kb" }));

app.get("/health", (req, res) => {
    res.status(200).json({
        message: "AI Classifier service is running!"
    });
});

app.post("/classify", async (req, res) => {
    try {
        const { email, categories } = req.body?? {};

        if (
            !email ||
            typeof email.subject !== "string" ||
            !Array.isArray(categories) ||
            categories.length === 0
        ) {
            return res.status(400).json({
                message: "Email subject and categories are required."
            });
        }

        const result = await classifyEmail(email, categories);

        return res.status(200).json(result);
    } catch (error) {
        console.error("Classification error:", error.message);

        return res.status(502).json({
            message: "Email classification failed."
        });
    }
});

app.listen(PORT, () => {
    console.log(`AI Classifier running on port ${PORT}`);
});

