const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middlewares/validate');
const { loginSchema, requestOtpSchema, verifyOtpSchema } = require('../validations/auth');

// Step 1: Credential validation (no JWT)
router.post('/login', validate(loginSchema), authController.login);

// Step 2a: Request OTP delivery
router.post('/request-otp', validate(requestOtpSchema), authController.requestOtp);

// Step 2b: Verify OTP (returns JWT)
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);

module.exports = router;
