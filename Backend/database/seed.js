
import pool from "../db.js";

const defaultCategories = [
    "Job & Placement",
    "Education",
    "Work",
    "Personal",
    "Important"
];

async function seedCategories() {
    try {
        for (const name of defaultCategories) {
            await pool.query(
                `INSERT INTO categories (user_id, name, type)
                 SELECT NULL, $1::text, 'system'
                 WHERE NOT EXISTS (
                     SELECT 1
                     FROM categories
                     WHERE LOWER(name::text) = LOWER($1::text)
                       AND type::text = 'system'
                 )`,
                [name]
            );
        }

        console.log("Default categories seeded successfully!");
    } catch (error) {
        console.error("Failed to seed categories:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

seedCategories();


