/* global document, window */
import chinese from './data.json';
import english from './data.en.json';

export function initializeHomepage(root, lang = 'cn') {
  const messages = {
    复制: 'Copy',
    复制提示词: 'Copy prompt',
    提示词: ' prompt',
    ' 项已检查': ' checked',
    '提示词已复制，可发送给应用项目中的 Agent':
      'Prompt copied. Send it to the Agent in your application project.',
    '复制未成功，请选中文字手动复制':
      'Copy failed. Select the text and copy it manually.',
    已复制: 'Copied',
    '已复制，可以粘贴到 Agent 中': 'Copied. Paste it into your Agent.',
    使用文档: 'Documentation',
  };
  const t = (text) => (lang === 'cn' ? text : (messages[text] ?? text));
  const content = lang === 'cn' ? chinese : english;
  const { icons, data, capabilityIcons, promptLibrary } = content;
  const capabilityHref = (id) =>
    (lang === 'cn' ? '/cn' : '') + '/capabilities/' + id + '/';
  const dialog = root.querySelector('dialog');
  const editor = root.querySelector('#prompt-editor');
  const tablist = root.querySelector('.prompt-tabs');
  const copyButton = root.querySelector('#copy-prompt');
  const resetButton = root.querySelector('#reset-prompt');
  const copyTimers = new Map();
  let activePrompts = [],
    current = 0,
    edits = {};
  function resetCopy() {
    clearTimeout(copyTimers.get(copyButton));
    copyButton.innerHTML = icons.Copy + t('复制');
    copyButton.disabled = editor.value.trim() === '';
  }
  function updateEditorActions() {
    resetButton.disabled = editor.value === activePrompts[current].text;
    resetCopy();
  }
  function selectPrompt(index, focus = false) {
    current = index;
    [...tablist.children].forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    root
      .querySelector('#prompt-panel')
      .setAttribute('aria-labelledby', 'prompt-tab-' + index);
    editor.value = Object.hasOwn(edits, index)
      ? edits[index]
      : activePrompts[index].text;
    editor.setAttribute('aria-label', activePrompts[index].label + t('提示词'));
    updateEditorActions();
    if (focus) tablist.children[index].focus();
  }
  function openCapability(index) {
    const [id, title, , desc] = data[index];
    const key = id === 'template-print' ? 'templatePrint' : id;
    const entry = promptLibrary[key];
    activePrompts = Object.values(entry.prompts);
    edits = {};
    root.querySelector('#dialog-title').textContent = entry.title || title;
    root.querySelector('#dialog-description').textContent =
      entry.description || desc;
    root.querySelector('#dialog-icon').innerHTML =
      icons[capabilityIcons[index]];
    tablist.replaceChildren();
    activePrompts.forEach((prompt, i) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.id = 'prompt-tab-' + i;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'prompt-panel');
      tab.textContent = prompt.label;
      tab.onclick = () => selectPrompt(i);
      tablist.append(tab);
    });
    selectPrompt(0);
    dialog.showModal();
    tablist.children[0].focus();
  }
  editor.addEventListener('input', () => {
    edits[current] = editor.value;
    updateEditorActions();
  });
  resetButton.onclick = () => {
    delete edits[current];
    selectPrompt(current);
  };
  tablist.addEventListener('keydown', (e) => {
    const focused = [...tablist.children].indexOf(e.target);
    if (focused < 0) return;
    let next;
    if (e.key === 'ArrowRight') next = (focused + 1) % activePrompts.length;
    else if (e.key === 'ArrowLeft')
      next = (focused - 1 + activePrompts.length) % activePrompts.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = activePrompts.length - 1;
    else return;
    e.preventDefault();
    selectPrompt(next, true);
  });
  dialog.addEventListener('close', () => {
    edits = {};
    resetCopy();
  });
  data.forEach(([id, title, , desc], index) => {
    const entry = promptLibrary[id === 'template-print' ? 'templatePrint' : id];
    const count = Object.keys(entry.prompts).length;
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.search = title + ' ' + desc;
    card.innerHTML =
      '<span class="icon" aria-hidden="true">' +
      icons[capabilityIcons[index]] +
      '</span><h3>' +
      title +
      '</h3><p>' +
      (entry.description || desc) +
      '</p><div class="cardfoot"><button type="button" aria-haspopup="dialog" aria-label="' +
      title +
      (lang === 'cn' ? '：查看 ' : ': View ') +
      count +
      (lang === 'cn' ? ' 个提示词">查看提示词（' : ' prompts">View prompts (') +
      count +
      (lang === 'cn' ? '）' : ')') +
      icons.ArrowRight +
      '</button><a href="' +
      capabilityHref(id) +
      '">' +
      t(t('使用文档')) +
      ' ' +
      icons.ArrowUpRight +
      '</a></div>';
    card.querySelector('button').onclick = () => openCapability(index);
    card.addEventListener('click', (e) => {
      if (!e.target.closest('a,button')) card.querySelector('button').click();
    });
    root.querySelector('#cards').append(card);
  });
  let timer;
  function notify(message) {
    clearTimeout(timer);
    root.querySelector('.toast').textContent = message;
    timer = setTimeout(
      () => (root.querySelector('.toast').textContent = ''),
      2600,
    );
  }
  async function copy(value, button) {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        ok = true;
      } else {
        const el = document.createElement('textarea');
        el.value = value;
        el.style.cssText = 'position:fixed;left:-9999px';
        (dialog.open ? dialog : root).append(el);
        el.select();
        ok = document.execCommand('copy');
        el.remove();
      }
    } catch {
      ok = false;
    }
    notify(
      ok
        ? t('已复制，可以粘贴到 Agent 中')
        : t('复制未成功，请选中文字手动复制'),
    );
    if (ok) {
      clearTimeout(copyTimers.get(button));
      const original =
        button === copyButton ? icons.Copy + t('复制') : button.innerHTML;
      button.innerHTML = icons.Check + t('已复制');
      button.disabled = true;
      copyTimers.set(
        button,
        setTimeout(() => {
          button.innerHTML = original;
          button.disabled = button === copyButton && editor.value.trim() === '';
        }, 1800),
      );
    }
  }
  root
    .querySelectorAll('[data-copy]')
    .forEach(
      (b) =>
        (b.onclick = () =>
          copy(root.querySelector('#' + b.dataset.copy).textContent, b)),
    );
  copyButton.onclick = () => copy(editor.value, copyButton);
  root.querySelector('.close').onclick = () => dialog.close();
  root.querySelector('#close-prompt').onclick = () => dialog.close();
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  root.querySelector('.search').addEventListener('input', (e) => {
    let visible = 0;
    root.querySelectorAll('.card').forEach((c) => {
      c.hidden = !c.dataset.search.includes(e.target.value.trim());
      if (!c.hidden) visible++;
    });
    root.querySelector('.empty').hidden = visible > 0;
  });

  return () => {
    clearTimeout(timer);
    for (const timeout of copyTimers.values()) clearTimeout(timeout);
    if (dialog.open) dialog.close();
  };
}
