// Behaviour of the Markdown page layout. Everything here enhances markup that already works without it: the page
// reads, links and navigates with this script blocked.

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = value;
    field.style.cssText = 'position:fixed;left:-9999px';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  }
}

function flash(button: HTMLElement, ok: boolean) {
  const label = button.querySelector('span') ?? button;
  const original = label.textContent;
  label.textContent =
    (ok ? button.dataset.copied : button.dataset.failed) ?? original;
  button.classList.toggle('is-copied', ok);
  setTimeout(() => {
    label.textContent = original;
    button.classList.remove('is-copied');
  }, 1800);
}

// Copy Markdown: fetch the page's published `.md` copy, the same file llms.txt links to.
document
  .querySelectorAll<HTMLButtonElement>('[data-copy-markdown]')
  .forEach((button) => {
    button.addEventListener('click', async () => {
      let ok: boolean;
      try {
        const response = await fetch(button.dataset.copyMarkdown!);
        ok = response.ok && (await copyText(await response.text()));
      } catch {
        ok = false;
      }
      flash(button, ok);
    });
  });

document
  .querySelectorAll<HTMLButtonElement>('[data-copy-text]')
  .forEach((button) => {
    button.addEventListener('click', async () => {
      flash(button, await copyText(button.dataset.copyText!));
      button.closest('details')?.removeAttribute('open');
    });
  });

document.addEventListener('click', (event) => {
  document
    .querySelectorAll<HTMLDetailsElement>('.page-actions__more[open]')
    .forEach((menu) => {
      if (!(event.target instanceof Node && menu.contains(event.target)))
        menu.open = false;
    });
});

// Code blocks: a copy button on each, labelled in the document's language (`<html lang>`).
const CODE_COPY_TEXT: Record<
  string,
  { label: string; copy: string; copied: string; failed: string }
> = {
  en: {
    label: 'Copy code',
    copy: 'Copy',
    copied: 'Copied',
    failed: 'Copy failed',
  },
  'zh-CN': {
    label: '复制代码',
    copy: '复制',
    copied: '已复制',
    failed: '复制失败',
  },
  vi: {
    label: 'Sao chép code',
    copy: 'Sao chép',
    copied: 'Đã sao chép',
    failed: 'Sao chép thất bại',
  },
};
document.querySelectorAll<HTMLPreElement>('.doc-content pre').forEach((pre) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'code-block';
  pre.replaceWith(wrapper);
  wrapper.append(pre);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'code-block__copy';
  const text =
    CODE_COPY_TEXT[document.documentElement.lang] ?? CODE_COPY_TEXT.en;
  button.setAttribute('aria-label', text.label);
  button.dataset.copied = text.copied;
  button.dataset.failed = text.failed;
  button.innerHTML = `<span>${text.copy}</span>`;
  button.addEventListener('click', async () =>
    flash(button, await copyText(pre.innerText.replace(/\n$/, ''))),
  );
  wrapper.append(button);
});

// Images open full size in a dialog, as the zoom on the previous site did.
const viewer = document.querySelector<HTMLDialogElement>('dialog.image-viewer');
if (viewer) {
  document
    .querySelectorAll<HTMLImageElement>('.doc-content img')
    .forEach((image) => {
      image.addEventListener('click', () => {
        const copy = image.cloneNode() as HTMLImageElement;
        copy.removeAttribute('loading');
        copy.removeAttribute('width');
        copy.removeAttribute('height');
        viewer.replaceChildren(copy);
        viewer.showModal();
      });
    });
  viewer.addEventListener('click', () => viewer.close());
}

// Sidebar groups a reader opens or closes stay that way for the rest of the visit.
const STORAGE_KEY = 'docs-sidebar-groups';
function readGroups(): Record<string, boolean> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as Record<
      string,
      boolean
    >;
  } catch {
    return {};
  }
}
const groups = readGroups();
document
  .querySelectorAll<HTMLDetailsElement>('details.sidebar-group')
  .forEach((group) => {
    const key = group.dataset.group!;
    const containsCurrent = Boolean(
      group.querySelector('[aria-current="page"]'),
    );
    if (key in groups && !containsCurrent) group.open = groups[key];
    group.addEventListener('toggle', () => {
      groups[key] = group.open;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
      } catch {
        // Storage can be unavailable; the group still toggles.
      }
    });
  });
document
  .querySelector('.doc-sidebar [aria-current="page"]')
  ?.scrollIntoView({ block: 'nearest' });

// The sidebar is a drawer on narrow screens.
const menuButton = document.querySelector<HTMLButtonElement>('.doc-bar__menu');
const sidebar = document.getElementById('doc-sidebar');
if (menuButton && sidebar) {
  const setOpen = (open: boolean) => {
    menuButton.setAttribute('aria-expanded', String(open));
    sidebar.toggleAttribute('data-open', open);
    document.body.classList.toggle('doc-drawer-open', open);
  };
  menuButton.addEventListener('click', () =>
    setOpen(!sidebar.hasAttribute('data-open')),
  );
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (!sidebar.hasAttribute('data-open') || !(event.target instanceof Node))
      return;
    if (!sidebar.contains(event.target) && !menuButton.contains(event.target))
      setOpen(false);
  });
}
document
  .querySelectorAll<HTMLDetailsElement>('.doc-bar__toc')
  .forEach((toc) => {
    toc.addEventListener('click', (event) => {
      if (event.target instanceof HTMLAnchorElement) toc.open = false;
    });
  });

// Highlight the section being read in the table of contents.
const tocLinks = [
  ...document.querySelectorAll<HTMLAnchorElement>(
    '.doc-outline [data-toc-link]',
  ),
];
const headings = tocLinks
  .map((link) => document.getElementById(link.dataset.tocLink!))
  .filter((heading): heading is HTMLElement => Boolean(heading));
if (headings.length > 0) {
  const update = () => {
    const offset = 96;
    let active = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top - offset <= 0) active = heading;
    }
    for (const link of tocLinks)
      link.classList.toggle('active', link.dataset.tocLink === active.id);
  };
  addEventListener('scroll', update, { passive: true });
  update();
}
