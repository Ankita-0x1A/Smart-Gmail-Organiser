import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
    try {
        // 1. Read the Authorization header
        const authHeader = req.headers.authorization;

        // 2. Check whether a token was provided
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. Please log in."
            });
        }

        // 3. Extract the token
        const token = authHeader.split(" ")[1];

        // 4. Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Store the authenticated user's ID on the request
        req.user = { userId: decoded.userId };

        // 6. Allow the request to continue
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please log in again."
        });
    }
}

export default authMiddleware;
