const jwt = require("jsonwebtoken");
const { getDB } = require("../config/db");

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const db = getDB();

        await db.collection("users").updateOne(
            { email: decoded.email.toLowerCase()},
            {
                $set: {
                    isVerified: true,
                    verifiedAt: new Date()
                }
            }
        );
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verified=true`);
    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=Invalid%20or%20expired%20verification%20link`);
    }
};

module.exports = verifyEmail;