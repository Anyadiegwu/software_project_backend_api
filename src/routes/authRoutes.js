const express = require("express");
const router = express.Router();
const { reporterRegister, reporterLogin, securityRegister, securityLogin } = require("../controllers/authController");
const { adminRegister, adminLogin, verifyOTP, requestPasswordReset, resetPassword, logout, requestOTP } = require("../controllers/authController");

router.post("/admin/register", adminRegister);
router.post("/admin/login", adminLogin);

router.post("/reporter/register", reporterRegister);
router.post("/reporter/login", reporterLogin);

router.post("/security/register", securityRegister);
router.post("/security/login", securityLogin);

router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", requestOTP);

router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.post("/logout", logout);

module.exports = router;