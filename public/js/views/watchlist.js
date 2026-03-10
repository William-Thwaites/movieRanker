import { getAuthHeaders } from '../api.js';

export async function loadWatchlist() {
  const container = document.getElementById('watchlistList');
  container.innerHTML = '<div class="loading">Loading your watchlist...</div>';

  try {
    const response = await fetch('/api/watchlist', {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (data.watchlist.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Your watchlist is empty. Find a movie and click "Add to Watchlist"!</p></div>';
      return;
    }

    container.innerHTML = data.watchlist.map(entry => `
      <div class="review-card" onclick="showMovieDetails(${entry.tmdbId})">
        <img src="${entry.posterUrl || '/placeholder.jpg'}" alt="${entry.title}">
        <div class="review-card-content">
          <h3>${entry.title}${entry.year ? ' (' + entry.year + ')' : ''}</h3>
          ${entry.genres && entry.genres.length > 0
            ? `<div class="review-genres">${entry.genres.join(', ')}</div>`
            : ''}
          <span class="review-date">Added ${new Date(entry.createdAt).toLocaleDateString()}</span>
          <div class="watchlist-action">
            <button
              onclick="event.stopPropagation(); removeFromWatchlist(${entry.tmdbId})"
              class="btn-danger">
              Remove
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Watchlist error:', error);
    container.innerHTML = '<div class="error">Failed to load watchlist</div>';
  }
}

export async function addToWatchlist(tmdbId, title, year, posterUrl) {
  try {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tmdbId, title, year, posterUrl })
    });

    if (response.ok) {
      window.showMovieDetails(tmdbId);
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to add to watchlist');
    }
  } catch (error) {
    console.error('Add to watchlist error:', error);
    alert('Failed to add to watchlist');
  }
}

export async function removeFromWatchlist(tmdbId, reloadModal = false) {
  try {
    const response = await fetch(`/api/watchlist/${tmdbId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      if (reloadModal) {
        window.showMovieDetails(tmdbId);
      } else {
        loadWatchlist();
      }
    } else {
      alert('Failed to remove from watchlist');
    }
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    alert('Failed to remove from watchlist');
  }
}
