const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. No token
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token"
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Get user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    // 5. Attach user to request
    req.user = user;

    next();

  } catch (err) {
    return res.status(401).json({
      message: "Not authorized, token failed"
    });
  }
};
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied for role: ${req.user.role}`
      });
    }

    next();
  };
};