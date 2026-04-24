const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");


// Reporter-only route
router.get(
  "/reporter-dashboard",
  protect,
  authorize("reporter"),
  (req, res) => {
    res.json({
      message: "Welcome Reporter",
      user: req.user
    });
  }
);


// Security-only route
router.get(
  "/security-dashboard",
  protect,
  authorize("security"),
  (req, res) => {
    res.json({
      message: "Welcome Security Personnel",
      user: req.user
    });
  }
);


// Shared route (any logged-in user)
router.get(
  "/profile",
  protect,
  (req, res) => {
    res.json(req.user);
  }
);

module.exports = router;