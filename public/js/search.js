export function initSearch() {
  const navSearchInput = document.getElementById('navSearchInput');
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
            window.showMovieDetails(parseInt(item.dataset.tmdbId));
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

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) {
      searchAutocomplete.classList.add('hidden');
    }
  });

  navSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchAutocomplete.classList.add('hidden');
      handleNavSearch();
    }
  });
}

export async function handleNavSearch() {
  const navSearchInput = document.getElementById('navSearchInput');
  const query = navSearchInput.value.trim();

  if (!query) return;

  window.switchView('search');

  const searchTitle = document.getElementById('searchTitle');
  const searchResults = document.getElementById('searchResults');

  searchTitle.textContent = `Search Results for "${query}"`;
  searchResults.innerHTML = '<div class="loading">🔍 Searching...</div>';

  try {
    const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const sortedResults = data.results.sort((a, b) => {
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
