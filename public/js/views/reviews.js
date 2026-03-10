import { getAuthHeaders } from '../api.js';
import { state } from '../state.js';

export async function loadMyReviews() {
  const container = document.getElementById('reviewsList');
  container.innerHTML = '<div class="loading">Loading your reviews...</div>';

  try {
    const response = await fetch('/api/reviews', {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.reviews.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No reviews yet. Start rating some movies!</p></div>';
      return;
    }

    const reviewsWithoutGenres = data.reviews.filter(
      review => !review.genres || review.genres.length === 0
    );

    if (reviewsWithoutGenres.length > 0) {
      container.innerHTML = '<div class="loading">Updating movie genres...</div>';

      try {
        const backfillResponse = await fetch('/api/reviews/backfill-genres', {
          method: 'POST',
          headers: getAuthHeaders()
        });
        const backfillData = await backfillResponse.json();
        console.log('Genre backfill result:', backfillData);

        const reloadResponse = await fetch('/api/reviews', {
          headers: getAuthHeaders()
        });
        const reloadData = await reloadResponse.json();
        data.reviews = reloadData.reviews;
      } catch (backfillError) {
        console.error('Genre backfill error:', backfillError);
      }
    }

    state.allReviews = data.reviews;

    populateGenreFilter();
    applyReviewFilters();
  } catch (error) {
    console.error('Reviews error:', error);
    container.innerHTML = '<div class="error">Failed to load reviews</div>';
  }
}

export function populateGenreFilter() {
  const checkboxes = document.querySelectorAll('#genreCheckboxes input[type="checkbox"]');
  checkboxes.forEach(checkbox => checkbox.checked = false);
}

export function toggleGenreFilter() {
  const genreCheckboxes = document.getElementById('genreCheckboxes');
  const toggleIcon = document.getElementById('genreToggle');

  genreCheckboxes.classList.toggle('collapsed');

  if (genreCheckboxes.classList.contains('collapsed')) {
    toggleIcon.textContent = '▼';
  } else {
    toggleIcon.textContent = '▲';
  }
}

export function clearGenreFilter() {
  const checkboxes = document.querySelectorAll('#genreCheckboxes input[type="checkbox"]');
  checkboxes.forEach(checkbox => checkbox.checked = false);
  applyReviewFilters();
}

export function applyReviewFilters() {
  const container = document.getElementById('reviewsList');
  const sortFilter = document.getElementById('sortFilter').value;

  const selectedGenres = Array.from(
    document.querySelectorAll('#genreCheckboxes input[type="checkbox"]:checked')
  ).map(checkbox => checkbox.value);

  let filteredReviews = state.allReviews;
  if (selectedGenres.length > 0) {
    filteredReviews = state.allReviews.filter(review =>
      review.genres && review.genres.some(genre => selectedGenres.includes(genre))
    );
  }

  let sortedReviews = [...filteredReviews];
  switch (sortFilter) {
    case 'highest':
      sortedReviews.sort((a, b) => b.rating - a.rating);
      break;
    case 'lowest':
      sortedReviews.sort((a, b) => a.rating - b.rating);
      break;
    case 'newest':
    default:
      sortedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
  }

  if (sortedReviews.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No reviews match the selected filters.</p></div>';
    return;
  }

  container.innerHTML = sortedReviews.map(review => `
    <div class="review-card" onclick="showMovieDetails(${review.tmdbId})">
      <img src="${review.posterUrl || '/placeholder.jpg'}" alt="${review.title}">
      <div class="review-card-content">
        <h3>${review.title} (${review.year})</h3>
        <div class="review-rating">Your Rating: ${review.rating}/10</div>
        ${review.genres && review.genres.length > 0 ?
          `<div class="review-genres">${review.genres.join(', ')}</div>` : ''}
        <p class="review-text">${review.review}</p>
        <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  `).join('');
}
