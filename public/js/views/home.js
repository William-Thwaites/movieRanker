import { getAuthHeaders } from '../api.js';
import { startCarouselAutoRotate, stopCarouselAutoRotate } from '../carousel.js';

export async function loadHomePage() {
  await Promise.all([
    loadFeaturedCarousel(),
    loadTrending(),
    loadForYou(),
    loadNewReleases()
  ]);
}

async function loadFeaturedCarousel() {
  const container = document.getElementById('featuredCarousel');
  container.innerHTML = '<div class="loading">Loading featured movies...</div>';

  try {
    const response = await fetch('/api/movies/newreleases');
    const data = await response.json();
    const topMovies = data.results.slice(0, 5);

    container.innerHTML = `
      <div class="carousel">
        ${topMovies.map((movie, index) => `
          <div class="carousel-item ${index === 0 ? 'active' : ''}" onclick="showMovieDetails(${movie.tmdbId})">
            <img src="${movie.posterUrl || '/placeholder.jpg'}" alt="${movie.title}">
            <div class="carousel-info">
              <h2>${movie.title}</h2>
              <p>${movie.overview}</p>
              <span class="rating">⭐ ${movie.rating.toFixed(1)}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="carousel-btn prev" onclick="moveCarousel(-1)">‹</button>
      <button class="carousel-btn next" onclick="moveCarousel(1)">›</button>
    `;

    startCarouselAutoRotate();

    container.addEventListener('mouseenter', stopCarouselAutoRotate);
    container.addEventListener('mouseleave', startCarouselAutoRotate);
  } catch (error) {
    console.error('Featured carousel error:', error);
    container.innerHTML = '<div class="error">Failed to load featured movies</div>';
  }
}

async function loadTrending() {
  const container = document.getElementById('trendingRow');
  container.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const response = await fetch('/api/movies/trending');
    const data = await response.json();
    displayMovieRow(container, data.results);
  } catch (error) {
    console.error('Trending error:', error);
    container.innerHTML = '<div class="error">Failed to load</div>';
  }
}

async function loadForYou() {
  const container = document.getElementById('forYouRow');
  container.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const response = await fetch('/api/movies/recommendations', {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    displayMovieRow(container, data.results);
  } catch (error) {
    console.error('For You error:', error);
    container.innerHTML = '<div class="error">Failed to load</div>';
  }
}

async function loadNewReleases() {
  const container = document.getElementById('newReleasesRow');
  container.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const response = await fetch('/api/movies/newreleases');
    const data = await response.json();
    displayMovieRow(container, data.results);
  } catch (error) {
    console.error('New releases error:', error);
    container.innerHTML = '<div class="error">Failed to load</div>';
  }
}

function displayMovieRow(container, movies) {
  container.innerHTML = movies.map(movie => `
    <div class="movie-poster" onclick="showMovieDetails(${movie.tmdbId})">
      <img src="${movie.posterUrl || '/placeholder.jpg'}" alt="${movie.title}">
      <div class="poster-overlay">
        <span class="poster-title">${movie.title}</span>
        <span class="poster-rating">⭐ ${(movie.rating || 0).toFixed(1)}</span>
      </div>
    </div>
  `).join('');
}
