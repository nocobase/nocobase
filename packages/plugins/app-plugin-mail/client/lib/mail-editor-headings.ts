/** Change the selected blocks using the browser's native editing command. */
export function setMailEditorHeading(editor: HTMLElement, tag: string): void {
  editor.focus();
  document.execCommand?.('formatBlock', false, tag);
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  // Chromium retains inline sizes when converting a block, including sizes
  // inherited by Enter. Let the new heading's CSS determine its typography.
  for (const block of editor.querySelectorAll<HTMLElement>(
    'p,h1,h2,h3,h4,h5,h6',
  )) {
    if (block.tagName.toLowerCase() !== tag || !range.intersectsNode(block))
      continue;
    for (const element of [
      block,
      ...block.querySelectorAll<HTMLElement>('*'),
    ]) {
      element.style.removeProperty('font-size');
      element.style.removeProperty('line-height');
      if (element.tagName === 'FONT') element.removeAttribute('size');
    }
  }
}
