const watchlistService = require('../services/watchlist.service');
const asyncHandler = require('../middleware/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const watchlist = await watchlistService.getUserWatchlist(req.userId);
  res.json({ watchlist });
});

const check = asyncHandler(async (req, res) => {
  const entry = await watchlistService.getWatchlistEntry(req.userId, req.params.tmdbId);
  res.json({ inWatchlist: !!entry, entry: entry || null });
});

const add = asyncHandler(async (req, res) => {
  const entry = await watchlistService.addToWatchlist(req.userId, req.body);
  res.status(201).json({ entry });
});

const remove = asyncHandler(async (req, res) => {
  await watchlistService.removeFromWatchlist(req.userId, req.params.tmdbId);
  res.json({ message: 'Removed from watchlist' });
});

module.exports = { list, check, add, remove };
