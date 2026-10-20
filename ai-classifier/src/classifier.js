
import dotenv from "dotenv";
import { classificationPrompt } from "./prompt.js";

dotenv.config();

export async function classifyEmail(email, categories) {
    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || "openrouter/free",

                messages: [
                    {
                        role: "system",
                        content: classificationPrompt
                    },
                    {
                        role: "user",
                        content: JSON.stringify({
                            categories,
                            email: {
                                sender: email.sender || "",
                                subject: email.subject || "",
                                body: email.body || ""
                            }
                        })
                    }
                ],

                // Ask the AI to return a JSON object.
                response_format: {
                    type: "json_object"
                },

                temperature: 0.1
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error?.message || `OpenRouter error: ${response.status}`
        );
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error("The AI returned an empty response.");
    }

    // Parse the JSON response directly.
    const result = JSON.parse(content);

    // Basic response validation.
    if (
        !result ||
        typeof result !== "object" ||
        !Array.isArray(result.categoryIds) ||
        typeof result.reason !== "string"
    ) {
        throw new Error("The AI returned an invalid JSON structure.");
    }

    if (
        result.categoryIds.some(
            id => !Number.isSafeInteger(id) || id <= 0
        ) ||
        new Set(result.categoryIds).size !== result.categoryIds.length
    ) {
        throw new Error("The AI returned invalid or duplicate category IDs.");
    }

    const allowedIds = new Set(
        categories.map(category => Number(category.id))
    );

    if (result.categoryIds.some(id => !allowedIds.has(id))) {
        throw new Error("The AI returned an unavailable category ID.");
    }

    return result;
}

