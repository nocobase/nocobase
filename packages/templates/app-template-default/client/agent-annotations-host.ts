import { defineClientExtension } from '@gchust/agent-annotations/extension';

export default defineClientExtension({
  id: 'nocobase.theme',
  apiVersion: 1,
  host: {
    theme: () =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    brandColor: () => {
      const primary = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim();
      // The annotation host accepts only #RRGGBB; custom themes may use other CSS color formats.
      return /^#[\da-f]{6}$/i.test(primary) ? primary : '#002ad1';
    },
    subscribe(listener) {
      const observer = new MutationObserver(listener);
      observer.observe(document.documentElement, {
        attributeFilter: ['class', 'data-theme'],
        attributes: true,
      });
      return () => observer.disconnect();
    },
  },
});
