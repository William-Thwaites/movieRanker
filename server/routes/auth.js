const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/auth.validator');
const ctrl = require('../controllers/auth.controller');

router.post('/signup', validate(schemas.signup), ctrl.signup);
router.post('/login', validate(schemas.login), ctrl.login);
router.get('/me', authMiddleware, ctrl.me);
router.post('/logout', authMiddleware, ctrl.logout);
router.post('/forgot-password', validate(schemas.forgotPassword), ctrl.forgotPassword);
router.post('/reset-password', validate(schemas.resetPassword), ctrl.resetPassword);
router.get('/verify-reset-token/:token', validate(schemas.verifyResetToken), ctrl.verifyResetToken);

module.exports = router;
