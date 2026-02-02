const axios = require('axios');

const OMDB_BASE_URL = 'https://www.omdbapi.com';

/**
 * Get ratings from OMDb using IMDb ID
 */
async function getRatings(imdbId) {
  try {
    const response = await axios.get(OMDB_BASE_URL, {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: imdbId,
      },
    });

    const data = response.data;

    if (data.Response === 'False') {
      return { imdbRating: null, rottenTomatoes: null };
    }

    // Extract Rotten Tomatoes from Ratings array
    const rtRating = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes');

    return {
      imdbRating: data.imdbRating !== 'N/A' ? data.imdbRating : null,
      rottenTomatoes: rtRating ? rtRating.Value : null,
      metascore: data.Metascore !== 'N/A' ? data.Metascore : null,
    };
  } catch (error) {
    console.error('OMDb ratings error:', error.message);
    return { imdbRating: null, rottenTomatoes: null, metascore: null };
  }
}

/**
 * Search OMDb by title (backup if no IMDb ID)
 */
async function searchByTitle(title, year) {
  try {
    const response = await axios.get(OMDB_BASE_URL, {
      params: {
        apikey: process.env.OMDB_API_KEY,
        t: title,
        y: year,
      },
    });

    const data = response.data;

    if (data.Response === 'False') {
      return null;
    }

    const rtRating = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes');

    return {
      imdbId: data.imdbID,
      imdbRating: data.imdbRating !== 'N/A' ? data.imdbRating : null,
      rottenTomatoes: rtRating ? rtRating.Value : null,
      metascore: data.Metascore !== 'N/A' ? data.Metascore : null,
    };
  } catch (error) {
    console.error('OMDb search error:', error.message);
    return null;
  }
}

module.exports = {
  getRatings,
  searchByTitle,
};