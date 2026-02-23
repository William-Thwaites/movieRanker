const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/movies.validator');
const ctrl = require('../controllers/movies.controller');

router.get('/search', validate(schemas.search), ctrl.search);
router.get('/trending', ctrl.trending);
router.get('/popular', ctrl.popular);
router.get('/toprated', ctrl.topRated);
router.get('/newreleases', ctrl.newReleases);
router.get('/recommendations', authMiddleware, ctrl.recommendations);
router.get('/:tmdbId', validate(schemas.getById), ctrl.getById);

module.exports = router;
