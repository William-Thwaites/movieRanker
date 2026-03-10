export const state = {
  currentUser: null,
  authToken: localStorage.getItem('authToken'),
  currentAuthTab: 'login',
  allReviews: [],
  currentSlide: 0,
  carouselInterval: null,
  autocompleteTimeout: null
};
