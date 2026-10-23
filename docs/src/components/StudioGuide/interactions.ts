/** Progressive enhancements for the static Studio setup guide. */
export function initializeStudioGuide(root: HTMLElement) {
  const status = root.querySelector<HTMLElement>('.guide-status');
  let statusTimer: ReturnType<typeof setTimeout> | undefined;
  function announce(message: string) {
    if (!status) return;
    clearTimeout(statusTimer);
    status.textContent = message;
    statusTimer = setTimeout(() => {
      status.textContent = '';
    }, 3500);
  }

  for (const button of root.querySelectorAll<HTMLButtonElement>(
    '[data-copy]',
  )) {
    const block = document.getElementById(button.dataset.copy ?? '');
    if (!block) continue;
    const labelElement =
      button.querySelector<HTMLElement>('[data-copy-label]') ?? button;
    const label = labelElement.textContent;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    button.addEventListener('click', () => {
      void copyText(block.textContent).then((copied) => {
        clearTimeout(resetTimer);
        button.toggleAttribute('data-copied', copied);
        if (copied) {
          labelElement.textContent = root.dataset.copied ?? '';
          announce(button.dataset.copyStatus ?? root.dataset.copyStatus ?? '');
          resetTimer = setTimeout(() => {
            labelElement.textContent = label;
            button.removeAttribute('data-copied');
          }, 2000);
        } else {
          labelElement.textContent = label;
          const range = document.createRange();
          range.selectNodeContents(block);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          announce(root.dataset.copyFallback ?? '');
        }
        button.focus({ preventScroll: true });
      });
    });
  }

  const dialog = root.querySelector<HTMLDialogElement>('.guide-lightbox');
  const largeImage = root.querySelector<HTMLImageElement>('.lightbox-image');
  const caption = root.querySelector<HTMLElement>('#image-caption');
  const originalLink = root.querySelector<HTMLAnchorElement>(
    '[data-original-image]',
  );
  if (dialog && largeImage && caption && originalLink) {
    let imageOpener: HTMLAnchorElement | undefined;
    let previousOverflow = '';
    for (const link of root.querySelectorAll<HTMLAnchorElement>(
      '.screenshot',
    )) {
      link.addEventListener('click', (event) => {
        const image = link.querySelector('img');
        if (
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey ||
          !image ||
          typeof dialog.showModal !== 'function'
        )
          return;
        event.preventDefault();
        imageOpener = link;
        largeImage.src = image.src;
        largeImage.alt = image.alt;
        const figureCaption = link
          .closest('figure')
          ?.querySelector('figcaption');
        caption.textContent = figureCaption
          ? [...figureCaption.childNodes]
              .map((node) => node.textContent?.replace(/\s+/g, ' ').trim())
              .filter(Boolean)
              .join(' · ')
          : image.alt;
        originalLink.href = link.href;
        previousOverflow = document.documentElement.style.overflow;
        dialog.showModal();
        document.documentElement.style.overflow = 'hidden';
      });
    }
    root
      .querySelector('[data-close-image]')
      ?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.documentElement.style.overflow = previousOverflow;
      imageOpener?.focus({ preventScroll: true });
    });
  }

  const directory = root.querySelector<HTMLDetailsElement>('.guide-directory');
  const mobile = window.matchMedia('(max-width: 900px)');
  function updateDirectory() {
    if (directory) directory.open = !mobile.matches;
  }
  updateDirectory();
  mobile.addEventListener('change', updateDirectory);

  const chapters = [...root.querySelectorAll<HTMLElement>('.chapter')];
  const links = [
    ...root.querySelectorAll<HTMLAnchorElement>('[data-chapter-link]'),
  ];
  const sectionLinks = [
    ...root.querySelectorAll<HTMLAnchorElement>('[data-section-link]'),
  ];
  const sections = sectionLinks.map((link) => ({
    link,
    target: document.getElementById(link.hash.slice(1)),
  }));
  const groups = [...root.querySelectorAll<HTMLDetailsElement>('.toc-chapter')];
  const manuallyToggled = new Set<HTMLDetailsElement>();
  for (const group of groups) {
    group.querySelector('summary')?.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) return;
      manuallyToggled.add(group);
    });
  }
  const progress = root.querySelector<HTMLProgressElement>('#guide-progress');
  const progressLabel = root.querySelector<HTMLElement>(
    '[data-progress-label]',
  );
  let pending = false;
  let previousChapter = -1;
  let previousLink: HTMLAnchorElement | undefined;
  function updateChapter() {
    let active = 0;
    chapters.forEach((chapter, index) => {
      if (chapter.getBoundingClientRect().top <= 160) active = index;
    });
    let currentLink = links[active];
    for (const { link, target } of sections) {
      if (
        target?.closest('.chapter') === chapters[active] &&
        target.getBoundingClientRect().top <= 160
      )
        currentLink = link;
    }
    links.forEach((link, index) =>
      link.toggleAttribute('data-active', index === active),
    );
    for (const link of [...links, ...sectionLinks]) {
      if (link === currentLink) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    if (previousChapter !== active) {
      groups.forEach((group, index) => {
        if (!manuallyToggled.has(group)) group.open = index === active;
      });
      previousChapter = active;
    }
    if (currentLink && currentLink !== previousLink && !mobile.matches) {
      const sidebar = root.querySelector<HTMLElement>('.guide-sidebar');
      if (sidebar && currentLink.getClientRects().length) {
        const bounds = sidebar.getBoundingClientRect();
        const item = currentLink.getBoundingClientRect();
        if (item.top < bounds.top || item.bottom > bounds.bottom)
          sidebar.scrollTop += item.top - bounds.top - bounds.height / 2;
      }
    }
    previousLink = currentLink;
    if (progress) progress.value = active + 1;
    if (progressLabel)
      progressLabel.textContent = `${String(active + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
    pending = false;
  }
  for (const link of [...links, ...sectionLinks]) {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
        return;
      if (directory && mobile.matches) directory.open = false;
    });
  }
  window.addEventListener(
    'scroll',
    () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(updateChapter);
    },
    { passive: true },
  );
  window.addEventListener('resize', updateChapter);
  window.addEventListener('hashchange', updateChapter);
  updateChapter();
}

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Clipboard timeout')),
            1500,
          );
        }),
      ]);
      return true;
    } catch {
      // Fall back to selection-based copying for HTTP previews and denied permissions.
    } finally {
      clearTimeout(timeout);
    }
  }
  const input = document.createElement('textarea');
  input.value = text;
  input.style.cssText = 'position:fixed;left:-10000px;top:0';
  document.body.append(input);
  input.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    input.remove();
  }
}
