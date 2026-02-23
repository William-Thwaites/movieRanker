// @ts-check
const { test, expect } = require('@playwright/test');

// Mock data matching the shape returned by the search API
const MOCK_SEARCH_RESULTS = {
  results: [
    {
      tmdbId: 603,
      title: 'The Matrix',
      year: '1999',
      overview: 'A computer hacker learns about the true nature of reality.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      rating: 8.7,
      vote_count: 24000,
    },
    {
      tmdbId: 604,
      title: 'The Matrix Reloaded',
      year: '2003',
      overview: 'Neo and the rebel leaders continue their fight.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/aA5qHS0FbSXO8PiYEFmEsMXeFsP.jpg',
      rating: 7.0,
      vote_count: 11000,
    },
    {
      tmdbId: 605,
      title: 'The Matrix Revolutions',
      year: '2003',
      overview: 'The human city of Zion defends itself.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/t1wm4PgOQ8e4z1C6tk1yDNrjpFr.jpg',
      rating: 6.7,
      vote_count: 9000,
    },
  ],
};

const MOCK_AUTH_USER = {
  user: {
    _id: 'test-user-id',
    username: 'TestUser',
    email: 'test@example.com',
  },
};

const MOCK_EMPTY_RESULTS = { results: [] };

test.describe('Search Bar', () => {

  test.beforeEach(async ({ page }) => {
    // Mock auth so the app shows the main UI
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUTH_USER),
      });
    });

    // Mock home page data endpoints to prevent real API calls
    await page.route('**/api/movies/newreleases', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EMPTY_RESULTS),
      });
    });

    await page.route('**/api/movies/trending', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EMPTY_RESULTS),
      });
    });

    await page.route('**/api/movies/recommendations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EMPTY_RESULTS),
      });
    });

    // Mock search endpoint
    await page.route('**/api/movies/search*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SEARCH_RESULTS),
      });
    });

    // Set fake auth token before page loads
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'fake-test-token-12345');
    });

    // Navigate and wait for app to be visible
    await page.goto('/');
    await expect(page.locator('#appContainer')).toBeVisible();
  });

  test('autocomplete appears when typing 2+ characters', async ({ page }) => {
    const searchInput = page.locator('#navSearchInput');
    const autocomplete = page.locator('#searchAutocomplete');

    await expect(searchInput).toBeVisible();

    await searchInput.click();
    await searchInput.fill('The Matrix');

    // Wait for autocomplete (300ms debounce + render)
    await expect(autocomplete).toBeVisible({ timeout: 5000 });

    // Verify correct number of results
    const items = autocomplete.locator('.autocomplete-item');
    await expect(items).toHaveCount(3);

    // Verify first result title and rating
    await expect(items.first().locator('.autocomplete-title')).toHaveText('The Matrix');
    await expect(items.first().locator('.autocomplete-rating')).toContainText('8.7');
  });

  test('autocomplete does not appear for single character input', async ({ page }) => {
    const searchInput = page.locator('#navSearchInput');
    const autocomplete = page.locator('#searchAutocomplete');

    await searchInput.click();
    await searchInput.fill('T');

    // Wait past the debounce period
    await page.waitForTimeout(500);

    await expect(autocomplete).toBeHidden();
  });

  test('pressing Enter triggers full search results view', async ({ page }) => {
    const searchInput = page.locator('#navSearchInput');

    await searchInput.click();
    await searchInput.fill('The Matrix');
    await searchInput.press('Enter');

    // Wait for search view to activate
    const searchView = page.locator('#searchView');
    await expect(searchView).toHaveClass(/active/, { timeout: 5000 });

    // Verify search title shows the query
    await expect(page.locator('#searchTitle')).toContainText('The Matrix');

    // Verify movie cards rendered
    const movieCards = page.locator('#searchResults .movie-card');
    await expect(movieCards).toHaveCount(3);
  });

  test('clicking autocomplete item hides dropdown and clears input', async ({ page }) => {
    // Mock movie detail endpoint for the clicked item
    await page.route('**/api/movies/603', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tmdbId: 603,
          title: 'The Matrix',
          year: '1999',
          overview: 'A computer hacker learns about the true nature of reality.',
          posterUrl: null,
          genres: ['Action', 'Sci-Fi'],
          runtime: 136,
          imdbRating: '8.7',
          rottenTomatoes: '83%',
          certification: 'R',
          watchProviders: null,
        }),
      });
    });

    await page.route('**/api/reviews/movie/603', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ review: null }),
      });
    });

    const searchInput = page.locator('#navSearchInput');
    const autocomplete = page.locator('#searchAutocomplete');

    await searchInput.click();
    await searchInput.fill('The Matrix');
    await expect(autocomplete).toBeVisible({ timeout: 5000 });

    // Click the first autocomplete item
    await autocomplete.locator('.autocomplete-item').first().click();

    // Dropdown should hide and input should clear
    await expect(autocomplete).toBeHidden();
    await expect(searchInput).toHaveValue('');
  });

  test('autocomplete hides when clicking outside', async ({ page }) => {
    const searchInput = page.locator('#navSearchInput');
    const autocomplete = page.locator('#searchAutocomplete');

    await searchInput.click();
    await searchInput.fill('The Matrix');
    await expect(autocomplete).toBeVisible({ timeout: 5000 });

    // Click outside the search area
    await page.locator('body').click({ position: { x: 10, y: 200 } });

    await expect(autocomplete).toBeHidden();
  });
});
