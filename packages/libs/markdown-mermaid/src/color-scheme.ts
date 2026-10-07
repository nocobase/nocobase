// The page's color scheme as the application's theme switch sets it: the `dark` class on the document element.
import { useSyncExternalStore } from 'react';

import type { MermaidColorScheme } from './render.ts';

function readScheme(): MermaidColorScheme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribeScheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
}

/** `dark` while the document element has the `dark` class, `light` otherwise; follows changes. */
export function useColorScheme(): MermaidColorScheme {
  return useSyncExternalStore(subscribeScheme, readScheme, () => 'light');
}
