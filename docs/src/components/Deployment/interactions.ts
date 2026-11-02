/** Tabs, section links and command copying for the static deployment guide. */
export function initializeDeployment(root: HTMLElement) {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  const aliases = JSON.parse(root.dataset.legacyAnchors ?? '{}') as Record<
    string,
    string
  >;

  function reveal(id: string) {
    const target = document.getElementById(id);
    if (!target || !root.contains(target)) return;
    const panel = target.closest<HTMLElement>('[role="tabpanel"]');
    if (panel) select(panel.id.replace('panel-', ''));
    let disclosure = target.closest('details');
    while (disclosure) {
      disclosure.open = true;
      disclosure = disclosure.parentElement?.closest('details') ?? null;
    }
    target.scrollIntoView();
  }

  function select(id: string) {
    const selected = panels.find((panel) => panel.id === `panel-${id}`);
    if (!selected) return;
    for (const panel of panels) panel.hidden = panel !== selected;
    for (const tab of tabs) {
      const active = tab.id === `tab-${id}`;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    const destinations = {
      skill: selected.querySelector<HTMLElement>('.deployment-skill')?.id,
      steps: selected.querySelector<HTMLElement>('.deployment-step h3')?.id,
    };
    for (const [action, destination] of Object.entries(destinations)) {
      const link = root.querySelector<HTMLAnchorElement>(
        `[data-guide-action="${action}"]`,
      );
      if (link && destination) link.setAttribute('href', `#${destination}`);
    }
  }

  function followHash() {
    let requested: string;
    try {
      requested = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    if (!requested) {
      select('pm2');
      return;
    }
    const id = Object.hasOwn(aliases, requested)
      ? aliases[requested]
      : requested;
    if (id !== requested) history.replaceState(history.state, '', `#${id}`);
    reveal(id);
  }

  function activate(tab: HTMLButtonElement) {
    const id = tab.id.replace('tab-', '');
    const current = panels.find((panel) => !panel.hidden);
    const heading = current?.querySelector('h2')?.getBoundingClientRect();
    const bar = tab.parentElement?.getBoundingClientRect();
    select(id);
    if (location.hash !== `#${id}`)
      history.pushState(history.state, '', `#${id}`);
    if (heading && bar && heading.top < bar.bottom) reveal(id);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
        return;
      event.preventDefault();
      const nextIndex =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : (index + (event.key === 'ArrowLeft' ? -1 : 1) + tabs.length) %
              tabs.length;
      const next = tabs[nextIndex];
      activate(next);
      next.focus();
    });
  });

  // Clicking the current fragment does not emit hashchange, but must still reopen its disclosure.
  root.addEventListener('click', (event) => {
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
        : null;
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    if (link.hash === location.hash) followHash();
  });
  window.addEventListener('hashchange', followHash);
  followHash();

  for (const command of root.querySelectorAll<HTMLElement>(
    '.deployment-command',
  )) {
    const button = command.querySelector<HTMLButtonElement>('button');
    const label = command.querySelector<HTMLElement>('[data-copy-text]');
    const status = command.querySelector<HTMLElement>('[role="status"]');
    const code = command.querySelector('code');
    if (!button || !label || !status || !code) continue;
    let timer: ReturnType<typeof setTimeout> | undefined;
    button.addEventListener('click', () => {
      void copyText(code.textContent).then((copied) => {
        clearTimeout(timer);
        label.textContent = copied
          ? (button.dataset.copiedLabel ?? '')
          : (button.dataset.copyLabel ?? '');
        status.className = copied ? 'sr-only' : 'copy-error';
        status.textContent = copied
          ? (button.dataset.copiedLabel ?? '')
          : (button.dataset.failedLabel ?? '');
        timer = setTimeout(() => {
          label.textContent = button.dataset.copyLabel ?? '';
          status.textContent = '';
          status.className = 'sr-only';
        }, 3000);
      });
    });
  }
}

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the selection-based copy supported on HTTP previews.
    }
  }
  const input = document.createElement('textarea');
  const focused = document.activeElement;
  input.value = text;
  input.style.cssText = 'position:fixed;left:-9999px';
  document.body.append(input);
  input.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    input.remove();
    if (focused instanceof HTMLElement) focused.focus();
  }
}
