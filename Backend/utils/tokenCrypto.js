import {
    createCipheriv,
    createDecipheriv,
    randomBytes
} from "node:crypto";

import dotenv from "dotenv";

dotenv.config();

const key = Buffer.from(
    process.env.TOKEN_ENCRYPTION_KEY || "",
    "hex"
);

if (key.length !== 32) {
    throw new Error(
        "TOKEN_ENCRYPTION_KEY must be a valid 32-byte key."
    );
}

export function encryptToken(token) {
    if (!token) return null;

    const iv = randomBytes(12);

    const cipher = createCipheriv(
        "aes-256-gcm",
        key,
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(token, "utf8"),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString("hex"),
        authTag.toString("hex"),
        encrypted.toString("hex")
    ].join(":");
}

export function decryptToken(encryptedToken) {
    if (!encryptedToken) return null;

    const [ivHex, authTagHex, encryptedHex] =
        encryptedToken.split(":");

    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error("Invalid encrypted token format.");
    }

    const decipher = createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(ivHex, "hex")
    );

    decipher.setAuthTag(
        Buffer.from(authTagHex, "hex")
    );

    return Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, "hex")),
        decipher.final()
    ]).toString("utf8");
}
