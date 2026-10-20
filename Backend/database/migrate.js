
import pool from "../db.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

async function runMigrations() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                filename TEXT UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const migrationsDirectory = path.join(
            currentDirectory,
            "migrations"
        );

        const files = (await fs.readdir(migrationsDirectory))
            .filter(file => file.endsWith(".sql"))
            .sort();

        for (const filename of files) {
            const existing = await pool.query(
                "SELECT id FROM schema_migrations WHERE filename = $1",
                [filename]
            );

            if (existing.rowCount > 0) {
                console.log(`Already applied: ${filename}`);
                continue;
            }

            const filePath = path.join(migrationsDirectory, filename);
            const sql = await fs.readFile(filePath, "utf8");

            const client = await pool.connect();

            try {
                await client.query("BEGIN");
                await client.query(sql);
                await client.query(
                    "INSERT INTO schema_migrations (filename) VALUES ($1)",
                    [filename]
                );
                await client.query("COMMIT");

                console.log(`Applied: ${filename}`);
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            } finally {
                client.release();
            }
        }

        console.log("Database migrations completed.");
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runMigrations();
