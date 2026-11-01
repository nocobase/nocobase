import { beforeEach } from 'vitest';

// jsdom has no matchMedia; individual phone tests override this desktop baseline.
beforeEach(() => {
  if (window.matchMedia) return;
  window.matchMedia = (media) => ({
    media,
    matches: false,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => true,
  });
});
