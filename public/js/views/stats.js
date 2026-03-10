import { getAuthHeaders } from '../api.js';

export async function loadStats() {
  const container = document.getElementById('statsContent');
  container.innerHTML = '<div class="loading">Loading stats...</div>';

  try {
    const response = await fetch('/api/reviews', {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    const reviews = data.reviews;

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;
    const highestRated = reviews.sort((a, b) => b.rating - a.rating)[0];

    let totalMinutes = 0;
    if (reviews.length > 0) {
      const movieDetailsPromises = reviews.map(review =>
        fetch(`/api/movies/${review.tmdbId}`).then(res => res.json())
      );
      const movieDetails = await Promise.all(movieDetailsPromises);
      totalMinutes = movieDetails.reduce((sum, movie) => sum + (movie.runtime || 0), 0);
    }
    const totalHours = (totalMinutes / 60).toFixed(1);

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalReviews}</div>
          <div class="stat-label">Movies Reviewed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgRating}</div>
          <div class="stat-label">Average Rating</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalHours}</div>
          <div class="stat-label">Hours Watched</div>
        </div>
        ${highestRated ? `
          <div class="stat-card">
            <div class="stat-value">${highestRated.rating}/10</div>
            <div class="stat-label">Highest Rated</div>
            <div class="stat-detail">${highestRated.title}</div>
          </div>
        ` : ''}
      </div>
    `;
  } catch (error) {
    console.error('Stats error:', error);
    container.innerHTML = '<div class="error">Failed to load stats</div>';
  }
}
