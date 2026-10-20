import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import authMiddleware from "../middleware/authMiddleware.js";

import {connectGmailAccount,syncGmailAccount} from "../services/gmailService.js";
import {
    getEmailsByAccount,
    getEmailById,
    markEmailAsRead
} from "../repositories/emailRepository.js";

import {
    getEmailAccountsByUser
} from "../repositories/emailAccountRepository.js";

dotenv.config();

const router = express.Router();

// Create the Google OAuth client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// GET /api/gmail/connect
// Requires the application's JWT
router.get("/connect", authMiddleware, (req, res) => {
    try {
        const userId = req.user.userId;

        // Create signed state to identify the application user
        const state = jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: [
                "https://www.googleapis.com/auth/gmail.readonly"
            ],
            prompt: "consent",
            state
        });

        return res.redirect(authUrl);
    } catch (error) {
        console.error("Gmail connect error:", error.message);

        return res.status(500).json({
            message: "Unable to start Google authorization."
        });
    }
});

// GET /api/gmail/callback
// Google redirects the browser here after authorization
router.get("/callback", async (req, res) => {
    try {
        const { code, error, state } = req.query;

        // 1. Check whether Google authorization was denied
        if (error) {
            return res.status(400).json({
                message: "Google authorization was denied."
            });
        }

        // 2. Validate the authorization code
        if (typeof code !== "string" || !code) {
            return res.status(400).json({
                message: "Authorization code is missing."
            });
        }

        // 3. Validate the OAuth state
        if (typeof state !== "string" || !state) {
            return res.status(400).json({
                message: "OAuth state is missing."
            });
        }

        // 4. Verify state and identify the application user
        let userId;

        try {
            const decodedState = jwt.verify(
                state,
                process.env.JWT_SECRET
            );

            userId = decodedState.userId;

            if (!userId) {
                return res.status(400).json({
                    message: "User ID is missing from OAuth state."
                });
            }
        } catch {
            return res.status(400).json({
                message: "Invalid or expired OAuth state. Please try again."
            });
        }

        // 5. Exchange Google's authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // 6. Save the Gmail account through the service
        const savedAccount = await connectGmailAccount({
            userId,
            oauth2Client,
            tokens
        });

        // 7. Return safe account details only
        return res.redirect(
            "http://localhost:5173/?gmailConnected=true"
            );
    } catch (error) {
        console.error(
            "Google OAuth callback failed:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to complete Google authorization."
        });
    }
});




// GET /api/gmail/accounts
// Fetch Gmail accounts belonging to the logged-in user
router.get("/accounts", authMiddleware, async (req, res) => {
    try {
        const accounts = await getEmailAccountsByUser(req.user.userId);

        return res.status(200).json({ accounts });
    } catch (error) {
        console.error("Fetch Gmail accounts failed:", error.message);

        return res.status(500).json({
            message: "Failed to fetch Gmail accounts."
        });
    }
});



router.get(
    "/accounts/:accountId/emails",
    authMiddleware,
    async (req, res) => {
        try {
            const { limit = "20", offset = "0", search = "", unread = "false" } = req.query;

            const parsedLimit = Number(limit);
            const parsedOffset = Number(offset);

            if (
                !Number.isInteger(parsedLimit) ||
                parsedLimit < 1 ||
                parsedLimit > 100 ||
                !Number.isInteger(parsedOffset) ||
                parsedOffset < 0
            ) {
                return res.status(400).json({
                    message: "Limit must be 1-100 and offset must be a non-negative integer."
                });
            }

            if (
                typeof search !== "string" ||
                typeof unread !== "string" ||
                !["true", "false"].includes(unread)
            ) {
                return res.status(400).json({
                    message: "Invalid search or unread parameter."
                });
            }

            const emails = await getEmailsByAccount({
                userId: req.user.userId,
                accountId: req.params.accountId,
                limit: parsedLimit,
                offset: parsedOffset,
                search: search.trim(),
                unread: unread === "true"
            });

            return res.status(200).json({
                count: emails.length,
                limit: parsedLimit,
                offset: parsedOffset,
                emails
            });
        } catch (error) {
            console.error("Fetch emails failed:", error.message);

            return res.status(500).json({
                message: "Failed to fetch emails."
            });
        }
    }
);





router.get(
    "/accounts/:accountId/emails/sync",
    authMiddleware,
    async (req, res) => {
        try {
            const userId = req.user.userId;
            const accountId = req.params.accountId;

            const result = await syncGmailAccount({
                userId,
                accountId,
                maxResults: 20
            });

            return res.status(200).json({
                message: "Gmail sync completed successfully!",
                ...result
            });
        } catch (error) {
            console.error("Gmail sync failed:", error.message);

            return res.status(500).json({
                message: "Failed to sync Gmail messages."
            });
        }
    }
);


router.get(
    "/accounts/:accountId/emails/:emailId",
    authMiddleware,
    async (req, res) => {
        try {
            const email = await getEmailById({
                userId: req.user.userId,
                accountId: req.params.accountId,
                emailId: req.params.emailId
            });

            if (!email) {
                return res.status(404).json({
                    message: "Email not found."
                });
            }

            return res.status(200).json({ email });
        } catch (error) {
            console.error("Fetch email detail failed:", error.message);

            return res.status(500).json({
                message: "Failed to fetch email details."
            });
        }
    }
);

router.patch(
    "/accounts/:accountId/emails/:emailId/read",
    authMiddleware,
    async (req, res) => {
        try {
            const email = await markEmailAsRead({
                userId: req.user.userId,
                accountId: req.params.accountId,
                emailId: req.params.emailId
            });

            if (!email) {
                return res.status(404).json({
                    message: "Email not found."
                });
            }

            return res.status(200).json({
                message: "Email marked as read.",
                email
            });
        } catch (error) {
            console.error("Mark email as read failed:", error.message);

            return res.status(500).json({
                message: "Failed to update email status."
            });
        }
    }
);



export default router;

