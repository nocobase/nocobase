// Close an open language menu on an outside click or Escape, and carry the reader's query string and fragment over to
// the other language, as the menu did when the site was a single-page application.
function closeMenus(event: MouseEvent | KeyboardEvent) {
  document
    .querySelectorAll<HTMLDetailsElement>('.docs-language-menu[open]')
    .forEach((menu) => {
      if (event instanceof KeyboardEvent) {
        if (event.key !== 'Escape') return;
        menu.querySelector('summary')?.focus();
      } else if (event.target instanceof Node && menu.contains(event.target)) {
        return;
      }
      menu.open = false;
    });
}

document.addEventListener('click', closeMenus);
document.addEventListener('keydown', closeMenus);
document.addEventListener('click', (event) => {
  const link =
    event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>('a[data-keep-location]')
      : null;
  if (!link || (!location.search && !location.hash)) return;
  const url = new URL(link.href);
  url.search = location.search;
  url.hash = location.hash;
  link.href = url.href;
});
