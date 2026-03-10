const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/watchlist.validator');
const ctrl = require('../controllers/watchlist.controller');

router.get('/', authMiddleware, ctrl.list);
router.get('/:tmdbId', authMiddleware, validate(schemas.checkWatchlist), ctrl.check);
router.post('/', authMiddleware, validate(schemas.addToWatchlist), ctrl.add);
router.delete('/:tmdbId', authMiddleware, validate(schemas.removeFromWatchlist), ctrl.remove);

module.exports = router;
