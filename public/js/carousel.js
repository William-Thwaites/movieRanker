import { state } from './state.js';

export function moveCarousel(direction) {
  const items = document.querySelectorAll('.carousel-item');
  const oldSlide = state.currentSlide;

  state.currentSlide = (state.currentSlide + direction + items.length) % items.length;

  items.forEach(item => {
    item.classList.remove('active', 'prev');
  });

  if (direction > 0) {
    items[oldSlide].classList.add('prev');
  } else {
    items[state.currentSlide].style.transform = 'translateX(-100%)';
    items[state.currentSlide].style.opacity = '0';
  }

  void items[state.currentSlide].offsetWidth;

  items[state.currentSlide].classList.add('active');
  items[state.currentSlide].style.transform = '';
  items[state.currentSlide].style.opacity = '';

  resetCarouselAutoRotate();
}

export function startCarouselAutoRotate() {
  if (state.carouselInterval) {
    clearInterval(state.carouselInterval);
  }
  state.carouselInterval = setInterval(() => {
    moveCarousel(1);
  }, 5000);
}

export function resetCarouselAutoRotate() {
  if (state.carouselInterval) {
    clearInterval(state.carouselInterval);
  }
  startCarouselAutoRotate();
}

export function stopCarouselAutoRotate() {
  if (state.carouselInterval) {
    clearInterval(state.carouselInterval);
    state.carouselInterval = null;
  }
}
