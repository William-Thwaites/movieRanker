import { getAuthHeaders } from './api.js';
import { stopCarouselAutoRotate } from './carousel.js';

export async function showMovieDetails(tmdbId) {
  stopCarouselAutoRotate();

  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  modalBody.innerHTML = '<div class="loading">Loading movie details...</div>';

  try {
    const [movieRes, reviewRes, watchlistRes] = await Promise.all([
      fetch(`/api/movies/${tmdbId}`),
      fetch(`/api/reviews/movie/${tmdbId}`, { headers: getAuthHeaders() }),
      fetch(`/api/watchlist/${tmdbId}`, { headers: getAuthHeaders() })
    ]);

    const movie = await movieRes.json();
    const { review: existingReview } = await reviewRes.json();
    const { inWatchlist } = await watchlistRes.json();

    modalBody.innerHTML = `
      <div class="movie-detail">
        <div class="movie-detail-poster">
          ${movie.posterUrl
            ? `<img src="${movie.posterUrl}" alt="${movie.title}">`
            : `<div class="no-poster" style="aspect-ratio: 2/3; border-radius: 12px;">🎬</div>`
          }
          ${movie.watchProviders ? `
            <div class="watch-providers">
              <h4>Where to Watch</h4>
              ${movie.watchProviders.flatrate && movie.watchProviders.flatrate.length > 0 ? `
                <div class="provider-section">
                  <div class="provider-dropdown-header" onclick="toggleProviderDropdown('stream-${tmdbId}')">
                    <span class="provider-label">Stream (${movie.watchProviders.flatrate.length})</span>
                    <span class="provider-toggle" id="stream-${tmdbId}-toggle">▼</span>
                  </div>
                  <div class="provider-logos collapsed" id="stream-${tmdbId}">
                    ${movie.watchProviders.flatrate.map(provider => `
                      <img src="https://image.tmdb.org/t/p/original${provider.logo_path}"
                           alt="${provider.provider_name}"
                           title="${provider.provider_name}"
                           class="provider-logo">
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${movie.watchProviders.rent && movie.watchProviders.rent.length > 0 ? `
                <div class="provider-section">
                  <div class="provider-dropdown-header" onclick="toggleProviderDropdown('rent-${tmdbId}')">
                    <span class="provider-label">Rent (${movie.watchProviders.rent.length})</span>
                    <span class="provider-toggle" id="rent-${tmdbId}-toggle">▼</span>
                  </div>
                  <div class="provider-logos collapsed" id="rent-${tmdbId}">
                    ${movie.watchProviders.rent.map(provider => `
                      <img src="https://image.tmdb.org/t/p/original${provider.logo_path}"
                           alt="${provider.provider_name}"
                           title="${provider.provider_name}"
                           class="provider-logo">
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${movie.watchProviders.buy && movie.watchProviders.buy.length > 0 ? `
                <div class="provider-section">
                  <div class="provider-dropdown-header" onclick="toggleProviderDropdown('buy-${tmdbId}')">
                    <span class="provider-label">Buy (${movie.watchProviders.buy.length})</span>
                    <span class="provider-toggle" id="buy-${tmdbId}-toggle">▼</span>
                  </div>
                  <div class="provider-logos collapsed" id="buy-${tmdbId}">
                    ${movie.watchProviders.buy.map(provider => `
                      <img src="https://image.tmdb.org/t/p/original${provider.logo_path}"
                           alt="${provider.provider_name}"
                           title="${provider.provider_name}"
                           class="provider-logo">
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${movie.watchProviders.link ? `
                <a href="${movie.watchProviders.link}" target="_blank" class="provider-link">View all options →</a>
              ` : ''}
            </div>
          ` : ''}
        </div>
        <div class="movie-detail-info">
          <h2>${movie.title}</h2>
          <p class="meta">
            ${movie.year}${movie.certification ? ' • ' + movie.certification : ''} • ${movie.runtime ? movie.runtime + ' min' : 'Runtime N/A'}
            ${movie.genres ? ' • ' + movie.genres.join(', ') : ''}
          </p>
          <p class="overview">${movie.overview || 'No overview available.'}</p>

          ${movie.director || (movie.cast && movie.cast.length > 0) ? `
            <div class="movie-credits">
              ${movie.director ? `
                <p class="director">Directed by <strong>${movie.director.name}</strong></p>
              ` : ''}
              ${movie.cast && movie.cast.length > 0 ? `
                <p class="cast-names"><span class="cast-label">Starring:</span> ${movie.cast.map(person =>
                  `<span class="cast-entry">${person.name}</span>`
                ).join('')}</p>
              ` : ''}
            </div>
          ` : ''}

          <div class="ratings">
            <div class="rating-badge imdb">
              <div class="label">IMDb</div>
              <div class="value">${movie.imdbRating || 'N/A'}</div>
            </div>
            <div class="rating-badge rt">
              <div class="label">Rotten Tomatoes</div>
              <div class="value">${movie.rottenTomatoes || 'N/A'}</div>
            </div>
            ${movie.metascore ? `
              <div class="rating-badge">
                <div class="label">Metascore</div>
                <div class="value">${movie.metascore}</div>
              </div>
            ` : ''}
            ${existingReview ? `
              <div class="rating-badge your-rating">
                <div class="label">Your Rating</div>
                <div class="value">${existingReview.rating}/10</div>
              </div>
            ` : ''}
          </div>

          <div class="watchlist-action">
            ${inWatchlist
              ? `<button onclick="removeFromWatchlist(${tmdbId}, true)" class="btn-secondary watchlist-btn">- Remove from Watchlist</button>`
              : `<button onclick="addToWatchlist(${tmdbId}, '${movie.title.replace(/'/g, "\\'")}', '${movie.year || ''}', '${movie.posterUrl || ''}')\" class="btn-primary watchlist-btn">+ Add to Watchlist</button>`
            }
          </div>

          ${existingReview ? `
            <div class="user-review">
              <h3>Your Review</h3>
              <p>${existingReview.review}</p>
              <div class="review-actions">
                <button onclick="editReview('${existingReview._id}', ${tmdbId})" class="btn-secondary">Edit Review</button>
                <button onclick="deleteReview('${existingReview._id}', ${tmdbId})" class="btn-danger">Delete Review</button>
              </div>
            </div>
          ` : `
            <div class="review-form">
              <h3>Add Your Review</h3>
              <form onsubmit="submitReview(event, ${tmdbId}, '${movie.title}', '${movie.year}', '${movie.posterUrl || ''}')">
                <div class="form-group">
                  <label>Rating (0-10)</label>
                  <input type="number" id="rating" min="0" max="10" step="0.5" required>
                </div>
                <div class="form-group">
                  <label>Your Review</label>
                  <textarea id="review" rows="4" required placeholder="What did you think?"></textarea>
                </div>
                <button type="submit" class="btn-primary">Submit Review</button>
              </form>
            </div>
          `}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Details error:', error);
    modalBody.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <p>Failed to load movie details.</p>
      </div>
    `;
  }
}

export function toggleProviderDropdown(providerId) {
  const providerLogos = document.getElementById(providerId);
  const toggleIcon = document.getElementById(`${providerId}-toggle`);

  if (providerLogos && toggleIcon) {
    providerLogos.classList.toggle('collapsed');

    if (providerLogos.classList.contains('collapsed')) {
      toggleIcon.textContent = '▼';
    } else {
      toggleIcon.textContent = '▲';
    }
  }
}

export async function submitReview(event, tmdbId, title, year, posterUrl) {
  event.preventDefault();

  const rating = parseFloat(document.getElementById('rating').value);
  const review = document.getElementById('review').value;

  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tmdbId, title, year, posterUrl, rating, review })
    });

    if (response.ok) {
      window.showMovieDetails(tmdbId);
    } else {
      const data = await response.json();
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Submit error:', error);
    alert('Failed to submit review');
  }
}

export async function deleteReview(reviewId, tmdbId) {
  if (!confirm('Are you sure you want to delete this review?')) return;

  try {
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      window.showMovieDetails(tmdbId);
    } else {
      alert('Failed to delete review');
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Failed to delete review');
  }
}

export async function editReview(reviewId, tmdbId) {
  const newRating = prompt('Enter new rating (0-10):');
  const newReview = prompt('Enter new review:');

  if (!newRating || !newReview) return;

  try {
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        rating: parseFloat(newRating),
        review: newReview
      })
    });

    if (response.ok) {
      window.showMovieDetails(tmdbId);
    } else {
      alert('Failed to update review');
    }
  } catch (error) {
    console.error('Update error:', error);
    alert('Failed to update review');
  }
}
