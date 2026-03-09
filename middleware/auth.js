const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authorization = req.headers['authorization'];
    if (!authorization) {
        return res.status(401).json({ message: "Access denied" });
    }

    const token = authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Access denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

function verifyTokenAndAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ message: "Admin access required" });
        }
    });
}

module.exports = { verifyToken, verifyTokenAndAdmin };