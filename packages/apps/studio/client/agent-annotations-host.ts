import { defineClientExtension } from '@gchust/agent-annotations/extension';

export default defineClientExtension({
  id: 'nocobase.theme',
  apiVersion: 1,
  host: {
    theme: () =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    brandColor: () => '#6d28d9',
    subscribe(listener) {
      const observer = new MutationObserver(listener);
      observer.observe(document.documentElement, {
        attributeFilter: ['class'],
        attributes: true,
      });
      return () => observer.disconnect();
    },
  },
});
