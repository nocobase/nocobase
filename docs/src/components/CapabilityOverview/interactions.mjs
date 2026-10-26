import { translator } from '../../scripts/interaction-messages.mjs';

export function initializeOverview(root, scenarios, lang = 'cn') {
  const t = translator(lang);
  const copyIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';
  const checkIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

  const tabs = root.querySelector('.scenario-tabs'),
    editor = root.querySelector('#scenario-prompt'),
    copyButton = root.querySelector('#copy'),
    resetButton = root.querySelector('#reset');
  const edits = {},
    checks = {};
  let active = 0,
    copyTimer,
    toastTimer;
  function actions() {
    clearTimeout(copyTimer);
    copyButton.innerHTML = copyIcon + t('复制提示词');
    copyButton.disabled = !editor.value.trim();
    resetButton.disabled = editor.value === scenarios[active].prompt;
  }
  function render(index, focus = false, updateHash = true) {
    active = index;
    const s = scenarios[index];
    [...tabs.children].forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === index));
      b.tabIndex = i === index ? 0 : -1;
    });
    root
      .querySelector('#scenario-panel')
      .setAttribute('aria-labelledby', 'scenario-tab-' + s.id);
    root.querySelector('#scenario-status').textContent = s.status;
    root.querySelector('#scenario-title').textContent = s.title;
    root.querySelector('#scenario-summary').textContent = s.summary;
    root.querySelector('#scenario-note').textContent = s.note;
    const dl = root.querySelector('.decisions');
    dl.replaceChildren();
    s.decisions.forEach(([title, text]) => {
      const row = document.createElement('div'),
        dt = document.createElement('dt'),
        dd = document.createElement('dd');
      dt.textContent = title;
      dd.textContent = text;
      row.append(dt, dd);
      dl.append(row);
    });
    editor.value = Object.hasOwn(edits, s.id) ? edits[s.id] : s.prompt;
    editor.setAttribute('aria-label', s.label + t('提示词'));
    actions();
    const checkList = root.querySelector('.check-items');
    checkList.replaceChildren();
    checks[s.id] ??= [];
    s.checks.forEach((text, i) => {
      const label = document.createElement('label'),
        box = document.createElement('input'),
        span = document.createElement('span');
      box.type = 'checkbox';
      box.checked = !!checks[s.id][i];
      span.textContent = text;
      box.onchange = () => {
        checks[s.id][i] = box.checked;
        updateCount();
      };
      label.append(box, span);
      checkList.append(label);
    });
    updateCount();
    const details = root.querySelector('.reference-image'),
      img = root.querySelector('#reference-image');
    details.hidden = !s.image;
    details.open = false;
    if (s.image) {
      img.src = s.image;
      img.alt = s.imageAlt;
    } else {
      img.removeAttribute('src');
      img.alt = '';
    }
    root.querySelector('#scenario-doc').href = s.doc;
    if (focus) tabs.children[index].focus();
    if (updateHash) history.replaceState(history.state, '', '#' + s.id);
  }
  function updateCount() {
    const s = scenarios[active];
    root.querySelector('#check-count').textContent =
      (checks[s.id] || []).filter(Boolean).length +
      ' / ' +
      s.checks.length +
      t(' 项已检查');
  }
  scenarios.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'scenario-tab-' + s.id;
    b.role = 'tab';
    b.setAttribute('aria-controls', 'scenario-panel');
    b.textContent = s.label;
    b.onclick = () => render(i);
    tabs.append(b);
  });
  tabs.onkeydown = (e) => {
    const i = [...tabs.children].indexOf(e.target);
    if (i < 0) return;
    let next;
    if (e.key === 'ArrowRight') next = (i + 1) % scenarios.length;
    else if (e.key === 'ArrowLeft')
      next = (i - 1 + scenarios.length) % scenarios.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = scenarios.length - 1;
    else return;
    e.preventDefault();
    render(next, true);
  };
  editor.oninput = () => {
    edits[scenarios[active].id] = editor.value;
    actions();
  };
  resetButton.onclick = () => {
    delete edits[scenarios[active].id];
    editor.value = scenarios[active].prompt;
    actions();
  };
  copyButton.onclick = async () => {
    const value = editor.value;
    let ok = false;
    try {
      if (navigator.clipboard && isSecureContext) {
        await navigator.clipboard.writeText(value);
        ok = true;
      } else {
        const el = document.createElement('textarea');
        el.value = value;
        el.style.cssText = 'position:fixed;left:-9999px';
        document.body.append(el);
        el.select();
        ok = document.execCommand('copy');
        el.remove();
      }
    } catch {
      // Show the manual-copy fallback below.
    }
    clearTimeout(toastTimer);
    const toast = root.querySelector('.toast');
    toast.textContent = ok
      ? t('提示词已复制，可发送给应用项目中的 Agent')
      : t('复制未成功，请选中文字手动复制');
    toastTimer = setTimeout(() => (toast.textContent = ''), 2500);
    if (ok) {
      copyButton.innerHTML = checkIcon + t('已复制');
      copyButton.disabled = true;
      copyTimer = setTimeout(actions, 1600);
    }
  };
  const initial = scenarios.findIndex((s) => s.id === location.hash.slice(1));
  render(initial < 0 ? 0 : initial, false, false);
  const onHashChange = () => {
    const index = scenarios.findIndex((s) => s.id === location.hash.slice(1));
    if (index >= 0) render(index, false, false);
  };
  window.addEventListener('hashchange', onHashChange);

  return () => {
    window.removeEventListener('hashchange', onHashChange);
    clearTimeout(copyTimer);
    clearTimeout(toastTimer);
  };
}
