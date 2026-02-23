const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validators/reviews.validator');
const ctrl = require('../controllers/reviews.controller');

router.get('/', authMiddleware, ctrl.list);
router.get('/movie/:tmdbId', authMiddleware, validate(schemas.getByMovie), ctrl.getByMovie);
router.post('/', authMiddleware, validate(schemas.createReview), ctrl.create);
router.put('/:id', authMiddleware, validate(schemas.updateReview), ctrl.update);
router.delete('/:id', authMiddleware, validate(schemas.deleteReview), ctrl.remove);
router.post('/backfill-genres', authMiddleware, ctrl.backfillGenres);

module.exports = router;
