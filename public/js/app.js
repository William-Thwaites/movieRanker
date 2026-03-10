import {
  checkAuth, initLoginForm, initForgotPasswordModal,
  switchAuthTab, logout,
  showForgotPasswordModal, closeForgotPasswordModal, handleForgotPassword
} from './auth.js';
import { moveCarousel } from './carousel.js';
import { initSearch } from './search.js';
import { loadHomePage } from './views/home.js';
import { loadMyReviews, toggleGenreFilter, clearGenreFilter, applyReviewFilters } from './views/reviews.js';
import { loadWatchlist, addToWatchlist, removeFromWatchlist } from './views/watchlist.js';
import { loadStats } from './views/stats.js';
import { showMovieDetails, toggleProviderDropdown, submitReview, deleteReview, editReview } from './modal.js';

// Expose globals for inline onclick handlers (static HTML and dynamically-generated HTML strings)
window.switchAuthTab = switchAuthTab;
window.logout = logout;
window.showForgotPasswordModal = showForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.handleForgotPassword = handleForgotPassword;
window.toggleGenreFilter = toggleGenreFilter;
window.clearGenreFilter = clearGenreFilter;
window.applyReviewFilters = applyReviewFilters;
window.showMovieDetails = showMovieDetails;
window.moveCarousel = moveCarousel;
window.toggleProviderDropdown = toggleProviderDropdown;
window.addToWatchlist = addToWatchlist;
window.removeFromWatchlist = removeFromWatchlist;
window.submitReview = submitReview;
window.deleteReview = deleteReview;
window.editReview = editReview;
window.switchView = switchView;
window.loadHomePage = loadHomePage;

// DOM elements
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const homeView = document.getElementById('homeView');
const reviewsView = document.getElementById('reviewsView');
const watchlistView = document.getElementById('watchlistView');
const statsView = document.getElementById('statsView');
const searchView = document.getElementById('searchView');

// Modal event listeners
closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
});
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const view = e.target.dataset.view;
    switchView(view);
  });
});

// Switch between views
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const viewMap = {
    home: homeView,
    reviews: reviewsView,
    watchlist: watchlistView,
    stats: statsView,
    search: searchView
  };

  viewMap[viewName]?.classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

  if (viewName === 'reviews') loadMyReviews();
  if (viewName === 'watchlist') loadWatchlist();
  if (viewName === 'stats') loadStats();
}

// Initialize
initSearch();
initLoginForm();
initForgotPasswordModal();
checkAuth();
