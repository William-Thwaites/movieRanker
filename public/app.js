// DOM Elements
const navSearchInput = document.getElementById('navSearchInput');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const loginPage = document.getElementById('loginPage');
const appContainer = document.getElementById('appContainer');
const loginForm = document.getElementById('loginForm');

// Views
const homeView = document.getElementById('homeView');
const reviewsView = document.getElementById('reviewsView');
const statsView = document.getElementById('statsView');
const searchView = document.getElementById('searchView');

// Authentication state
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let currentAuthTab = 'login'; // 'login' or 'signup'

// Helper function to get auth headers
function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

// Check authentication on page load
async function checkAuth() {
  if (!authToken) {
    showLoginPage();
    return;
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      showApp();
      switchView('home');
      loadHomePage();
    } else {
      // Token invalid, clear it
      localStorage.removeItem('authToken');
      authToken = null;
      showLoginPage();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showLoginPage();
  }
}

// Show login page, hide app
function showLoginPage() {
  loginPage.classList.remove('hidden');
  appContainer.classList.add('hidden');
}

// Show app, hide login page
function showApp() {
  loginPage.classList.add('hidden');
  appContainer.classList.remove('hidden');

  // Update user menu
  const usernameDisplay = document.getElementById('usernameDisplay');
  if (currentUser) {
    usernameDisplay.textContent = currentUser.username;
  }
}

// Switch between login and signup tabs
function switchAuthTab(mode) {
  currentAuthTab = mode;
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginUsernameGroup = document.getElementById('loginUsernameGroup');
  const loginError = document.getElementById('loginError');

  loginError.textContent = '';
  loginForm.reset();

  if (mode === 'signup') {
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
    loginSubmitBtn.textContent = 'Sign Up';
    loginUsernameGroup.style.display = 'block';
  } else {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginSubmitBtn.textContent = 'Login';
    loginUsernameGroup.style.display = 'none';
  }
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const username = document.getElementById('loginUsername').value;
  const loginError = document.getElementById('loginError');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');

  loginError.textContent = '';
  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = currentAuthTab === 'login' ? 'Logging in...' : 'Signing up...';

  try {
    const endpoint = currentAuthTab === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = currentAuthTab === 'login'
      ? { email, password }
      : { email, password, username };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user info
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      currentUser = data.user;

      // Show app and switch to home view
      showApp();
      switchView('home');
      loadHomePage();
    } else {
      loginError.textContent = data.error || 'Authentication failed';
    }
  } catch (error) {
    console.error('Auth error:', error);
    loginError.textContent = 'Network error. Please try again.';
  } finally {
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = currentAuthTab === 'login' ? 'Login' : 'Sign Up';
  }
});

// Logout function
async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  // Clear local auth state
  localStorage.removeItem('authToken');
  authToken = null;
  currentUser = null;

  // Show login page
  switchAuthTab('login');
  showLoginPage();
}

// Autocomplete
const searchAutocomplete = document.getElementById('searchAutocomplete');
let autocompleteTimeout = null;

navSearchInput.addEventListener('input', () => {
  const query = navSearchInput.value.trim();
  clearTimeout(autocompleteTimeout);

  if (query.length < 2) {
    searchAutocomplete.classList.add('hidden');
    return;
  }

  searchAutocomplete.innerHTML = '<div class="autocomplete-loading">Searching...</div>';
  searchAutocomplete.classList.remove('hidden');

  autocompleteTimeout = setTimeout(async () => {
    try {
      const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        searchAutocomplete.innerHTML = '<div class="autocomplete-empty">No movies found</div>';
        return;
      }

      const sorted = data.results.sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.log10((a.vote_count || 0) + 1);
        const scoreB = (b.rating || 0) * Math.log10((b.vote_count || 0) + 1);
        return scoreB - scoreA;
      });

      const top = sorted.slice(0, 6);
      searchAutocomplete.innerHTML = top.map(movie => `
        <div class="autocomplete-item" data-tmdb-id="${movie.tmdbId}">
          <img class="autocomplete-poster" src="${movie.posterUrl || '/placeholder.jpg'}" alt="${movie.title}">
          <div class="autocomplete-info">
            <div class="autocomplete-title">${movie.title}</div>
            <div class="autocomplete-meta">${movie.year || ''}</div>
          </div>
          ${movie.rating ? `<span class="autocomplete-rating">⭐ ${movie.rating.toFixed(1)}</span>` : ''}
        </div>
      `).join('') + (data.results.length > 6
        ? `<div class="autocomplete-view-all" id="autocompleteViewAll">View all ${data.results.length} results</div>`
        : '');

      searchAutocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          searchAutocomplete.classList.add('hidden');
          navSearchInput.value = '';
          showMovieDetails(parseInt(item.dataset.tmdbId));
        });
      });

      const viewAllBtn = document.getElementById('autocompleteViewAll');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
          searchAutocomplete.classList.add('hidden');
          handleNavSearch();
        });
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      searchAutocomplete.innerHTML = '<div class="autocomplete-empty">Search failed</div>';
    }
  }, 300);
});

// Close autocomplete when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-search')) {
    searchAutocomplete.classList.add('hidden');
  }
});

// Event Listeners
navSearchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchAutocomplete.classList.add('hidden');
    handleNavSearch();
  }
});
closeModal.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
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
    stats: statsView,
    search: searchView
  };

  viewMap[viewName]?.classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

  if (viewName === 'reviews') loadMyReviews();
  if (viewName === 'stats') loadStats();
}

// Load home page content
async function loadHomePage() {
  await Promise.all([
    loadFeaturedCarousel(),
    loadTrending(),
    loadForYou(),
    loadNewReleases()
  ]);
}

// Load featured carousel (new releases)
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

    // Start auto-rotation after carousel is loaded
    startCarouselAutoRotate();

    // Pause on hover
    container.addEventListener('mouseenter', stopCarouselAutoRotate);
    container.addEventListener('mouseleave', startCarouselAutoRotate);
  } catch (error) {
    console.error('Featured carousel error:', error);
    container.innerHTML = '<div class="error">Failed to load featured movies</div>';
  }
}

// Carousel navigation
let currentSlide = 0;
let carouselInterval = null;

// Reviews data storage for filtering
let allReviews = [];

function moveCarousel(direction) {
  const items = document.querySelectorAll('.carousel-item');
  const oldSlide = currentSlide;

  // Calculate new slide index
  currentSlide = (currentSlide + direction + items.length) % items.length;

  // Remove all transition classes
  items.forEach(item => {
    item.classList.remove('active', 'prev');
  });

  // Set up transition based on direction
  if (direction > 0) {
    // Moving forward: old slide goes left, new slide comes from right
    items[oldSlide].classList.add('prev');
  } else {
    // Moving backward: new slide comes from left
    items[currentSlide].style.transform = 'translateX(-100%)';
    items[currentSlide].style.opacity = '0';
  }

  // Trigger reflow to ensure transition works
  void items[currentSlide].offsetWidth;

  // Activate new slide
  items[currentSlide].classList.add('active');
  items[currentSlide].style.transform = '';
  items[currentSlide].style.opacity = '';

  // Reset auto-rotation timer
  resetCarouselAutoRotate();
}

// Auto-rotate carousel every 5 seconds
function startCarouselAutoRotate() {
  // Always clear any existing interval first to prevent multiple timers
  if (carouselInterval) {
    clearInterval(carouselInterval);
  }
  carouselInterval = setInterval(() => {
    moveCarousel(1);
  }, 5000);
}

function resetCarouselAutoRotate() {
  if (carouselInterval) {
    clearInterval(carouselInterval);
  }
  startCarouselAutoRotate();
}

function stopCarouselAutoRotate() {
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }
}

// Load trending movies
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

// Load "For You" movies (AI-powered recommendations based on reviews)
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

// Load new releases
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

// Display movie row
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

// Load my reviews
async function loadMyReviews() {
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

    // Check if any reviews are missing genres
    const reviewsWithoutGenres = data.reviews.filter(
      review => !review.genres || review.genres.length === 0
    );

    // If reviews are missing genres, backfill them
    if (reviewsWithoutGenres.length > 0) {
      container.innerHTML = '<div class="loading">Updating movie genres...</div>';

      try {
        const backfillResponse = await fetch('/api/reviews/backfill-genres', {
          method: 'POST',
          headers: getAuthHeaders()
        });
        const backfillData = await backfillResponse.json();
        console.log('Genre backfill result:', backfillData);

        // Reload reviews after backfill
        const reloadResponse = await fetch('/api/reviews', {
          headers: getAuthHeaders()
        });
        const reloadData = await reloadResponse.json();
        data.reviews = reloadData.reviews;
      } catch (backfillError) {
        console.error('Genre backfill error:', backfillError);
        // Continue with existing data even if backfill fails
      }
    }

    // Store reviews globally for filtering
    allReviews = data.reviews;

    // Populate genre dropdown
    populateGenreFilter();

    // Apply initial filter (defaults to newest first, all genres)
    applyReviewFilters();
  } catch (error) {
    console.error('Reviews error:', error);
    container.innerHTML = '<div class="error">Failed to load reviews</div>';
  }
}

// Populate genre filter (clear checkboxes)
function populateGenreFilter() {
  const checkboxes = document.querySelectorAll('#genreCheckboxes input[type="checkbox"]');
  checkboxes.forEach(checkbox => checkbox.checked = false);
}

// Toggle genre filter visibility
function toggleGenreFilter() {
  const genreCheckboxes = document.getElementById('genreCheckboxes');
  const toggleIcon = document.getElementById('genreToggle');

  genreCheckboxes.classList.toggle('collapsed');

  if (genreCheckboxes.classList.contains('collapsed')) {
    toggleIcon.textContent = '▼';
  } else {
    toggleIcon.textContent = '▲';
  }
}

// Toggle provider dropdown visibility
function toggleProviderDropdown(providerId) {
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

// Clear genre filter
function clearGenreFilter() {
  const checkboxes = document.querySelectorAll('#genreCheckboxes input[type="checkbox"]');
  checkboxes.forEach(checkbox => checkbox.checked = false);
  applyReviewFilters();
}

// Apply review filters
function applyReviewFilters() {
  const container = document.getElementById('reviewsList');
  const sortFilter = document.getElementById('sortFilter').value;

  // Get selected genres from checkboxes
  const selectedGenres = Array.from(
    document.querySelectorAll('#genreCheckboxes input[type="checkbox"]:checked')
  ).map(checkbox => checkbox.value);

  // Filter by genres
  let filteredReviews = allReviews;
  if (selectedGenres.length > 0) {
    filteredReviews = allReviews.filter(review =>
      review.genres && review.genres.some(genre => selectedGenres.includes(genre))
    );
  }

  // Sort reviews
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

  // Display filtered reviews
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

// Load stats
async function loadStats() {
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

    // Calculate total hours watched
    let totalMinutes = 0;
    if (reviews.length > 0) {
      // Fetch movie details for each review to get runtime
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

// Search from navbar
async function handleNavSearch() {
  const query = navSearchInput.value.trim();

  if (!query) return;

  // Switch to search view
  switchView('search');

  const searchTitle = document.getElementById('searchTitle');
  const searchResults = document.getElementById('searchResults');

  searchTitle.textContent = `Search Results for "${query}"`;
  searchResults.innerHTML = '<div class="loading">🔍 Searching...</div>';

  try {
    const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Sort by relevance: popularity (vote_count) and rating
      const sortedResults = data.results.sort((a, b) => {
        // Calculate relevance score: rating * log(vote_count + 1)
        const scoreA = (a.rating || 0) * Math.log10((a.vote_count || 0) + 1);
        const scoreB = (b.rating || 0) * Math.log10((b.vote_count || 0) + 1);
        return scoreB - scoreA;
      });

      searchResults.innerHTML = sortedResults.map(movie => `
        <div class="movie-card" onclick="showMovieDetails(${movie.tmdbId})">
          <img src="${movie.posterUrl || '/placeholder.jpg'}" alt="${movie.title}">
          <div class="movie-card-info">
            <h3>${movie.title}</h3>
            <span class="year">${movie.year}</span>
          </div>
        </div>
      `).join('');
    } else {
      searchResults.innerHTML = `<div class="empty-state"><p>No movies found for "${query}"</p></div>`;
    }
    navSearchInput.value = '';
  } catch (error) {
    console.error('Search error:', error);
    searchResults.innerHTML = `<div class="error">Search failed. Please try again.</div>`;
  }
}

// Show movie details in modal
async function showMovieDetails(tmdbId) {
  // Stop carousel rotation when viewing movie details
  stopCarouselAutoRotate();

  modal.classList.remove('hidden');
  modalBody.innerHTML = '<div class="loading">Loading movie details...</div>';

  try {
    // Fetch movie details and user's review in parallel
    const [movieRes, reviewRes] = await Promise.all([
      fetch(`/api/movies/${tmdbId}`),
      fetch(`/api/reviews/movie/${tmdbId}`, {
        headers: getAuthHeaders()
      })
    ]);

    const movie = await movieRes.json();
    const { review: existingReview } = await reviewRes.json();

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

// Submit a new review
async function submitReview(event, tmdbId, title, year, posterUrl) {
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
      showMovieDetails(tmdbId); // Reload to show the review
    } else {
      const data = await response.json();
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Submit error:', error);
    alert('Failed to submit review');
  }
}

// Delete a review
async function deleteReview(reviewId, tmdbId) {
  if (!confirm('Are you sure you want to delete this review?')) return;

  try {
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      showMovieDetails(tmdbId); // Reload to show the form again
    } else {
      alert('Failed to delete review');
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Failed to delete review');
  }
}

// Edit a review (shows the form with existing data)
async function editReview(reviewId, tmdbId) {
  // For now, we'll just show a prompt - you can make this fancier later
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
      showMovieDetails(tmdbId);
    } else {
      alert('Failed to update review');
    }
  } catch (error) {
    console.error('Update error:', error);
    alert('Failed to update review');
  }
}

// Forgot Password Modal Functions
function showForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').classList.remove('hidden');
  document.getElementById('forgotEmail').value = '';
  document.getElementById('forgotPasswordError').textContent = '';
  document.getElementById('forgotPasswordSuccess').textContent = '';
}

function closeForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').classList.add('hidden');
}

async function handleForgotPassword(event) {
  event.preventDefault();

  const email = document.getElementById('forgotEmail').value;
  const errorDiv = document.getElementById('forgotPasswordError');
  const successDiv = document.getElementById('forgotPasswordSuccess');
  const submitBtn = document.getElementById('forgotPasswordBtn');

  errorDiv.textContent = '';
  successDiv.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      successDiv.textContent = data.message;
      document.getElementById('forgotPasswordForm').reset();
    } else {
      errorDiv.textContent = data.error || 'Failed to process request';
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    errorDiv.textContent = 'Network error. Please try again.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Reset Link';
  }
}

// Close forgot password modal when clicking outside
document.getElementById('forgotPasswordModal').addEventListener('click', (e) => {
  if (e.target.id === 'forgotPasswordModal') {
    closeForgotPasswordModal();
  }
});

// Initialize app - check authentication
checkAuth();