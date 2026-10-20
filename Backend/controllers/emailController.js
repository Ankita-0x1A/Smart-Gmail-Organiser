
import { getEmailsByAccount } from "../repositories/emailRepository.js";

export async function getAccountEmails(req, res) {
    try {
        const userId = req.user.userId;
        const accountId = req.params.accountId;

        const emails = await getEmailsByAccount({
            userId,
            accountId,
            limit: 50,
            offset: 0
        });

        return res.status(200).json({
            count: emails.length,
            emails
        });
    } catch (error) {
        console.error("Fetch emails failed:", error.message);
        return res.status(500).json({
            message: "Failed to retrieve emails."
        });
    }
}
