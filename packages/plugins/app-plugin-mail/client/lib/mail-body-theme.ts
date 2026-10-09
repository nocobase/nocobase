/** Bridge the App theme into an isolated, script-disabled message document. */
export function observeMailBodyTheme(
  frame: HTMLIFrameElement,
  document: Document,
): () => void {
  const host = frame.ownerDocument;
  const root = document.documentElement;
  const elements = [
    root,
    ...document.querySelectorAll<HTMLElement>('body, body *'),
  ];
  // Restore sender formatting when returning to light mode. Only the display
  // document is changed; stored and outgoing messages retain their original HTML.
  const originals = elements.map((element) => element.getAttribute('style'));
  const properties = [
    'foreground',
    'primary',
    'muted-foreground',
    'border',
    'font-sans',
    'text-sm',
    'text-sm--line-height',
  ];
  const sync = (): void => {
    const style = host.defaultView!.getComputedStyle(frame);
    const dark = !!frame.closest('.dark');
    // Matching schemes prevent the browser from painting an opaque iframe canvas.
    frame.style.colorScheme = dark ? 'dark' : 'light';
    elements.forEach((element, index) => {
      const original = originals[index];
      if (original === null) element.removeAttribute('style');
      else element.setAttribute('style', original);
      if (!dark) return;
      element.style.setProperty(
        'color',
        element.closest('a[href]')
          ? 'var(--mail-primary)'
          : 'var(--mail-foreground)',
        'important',
      );
      element.style.setProperty(
        'background-color',
        'var(--mail-background)',
        'important',
      );
      element.style.setProperty('background-image', 'none', 'important');
      element.style.setProperty(
        'border-color',
        'var(--mail-border)',
        'important',
      );
      element.style.setProperty(
        '-webkit-text-fill-color',
        'currentColor',
        'important',
      );
      element.style.setProperty('text-shadow', 'none', 'important');
    });
    for (const property of properties) {
      const value = style.getPropertyValue(`--${property}`).trim();
      if (value) root.style.setProperty(`--mail-${property}`, value);
    }
    // Let the surrounding card, sheet, or composer surface show through.
    // The page background token is darker than card surfaces in dark themes.
    root.style.setProperty('--mail-background', 'transparent');
    if (style.color) root.style.setProperty('--mail-foreground', style.color);
    root.style.setProperty(
      'color-scheme',
      dark ? 'dark' : 'light',
      'important',
    );
    for (const summary of document.querySelectorAll<HTMLElement>(
      '.nocobase-mail-quoted-content > summary',
    )) {
      summary.style.setProperty(
        'color',
        'var(--mail-muted-foreground)',
        'important',
      );
    }
  };
  sync();
  const observer = new MutationObserver(sync);
  // Includes local theme scopes as well as the App's root theme and mode.
  for (
    let ancestor = frame.parentElement;
    ancestor;
    ancestor = ancestor.parentElement
  ) {
    observer.observe(ancestor, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    });
  }
  return () => observer.disconnect();
}
