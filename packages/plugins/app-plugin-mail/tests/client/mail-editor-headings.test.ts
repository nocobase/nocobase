import { afterEach, describe, expect, it, vi } from 'vitest';
import { setMailEditorHeading } from '../../client/lib/mail-editor-headings.js';

describe('mail heading changes', () => {
  const originalExecCommand = document.execCommand;
  afterEach(() => {
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: originalExecCommand,
    });
    document.body.innerHTML = '';
    window.getSelection()?.removeAllRanges();
  });

  it.each(['h2', 'h3', 'h4', 'h5', 'h6', 'p'])(
    'clears size overrides for %s while preserving other formatting and unselected blocks',
    (tag) => {
      const editor = document.createElement('div');
      editor.contentEditable = 'true';
      editor.innerHTML =
        '<h2 style="font-size:24px;line-height:30px;color:red"><font size="5" style="font-size:24px"><b>Heading</b></font></h2><p style="font-size:32px">Untouched</p>';
      document.body.append(editor);
      const range = document.createRange();
      range.selectNodeContents(editor.firstElementChild!);
      window.getSelection()!.addRange(range);
      // Model Chromium formatBlock retaining inline styles and the selection.
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: vi.fn(() => {
          const previous = editor.firstElementChild!;
          const block = document.createElement(tag);
          block.setAttribute('style', previous.getAttribute('style')!);
          block.innerHTML = previous.innerHTML;
          previous.replaceWith(block);
          range.selectNodeContents(block);
          window.getSelection()!.removeAllRanges();
          window.getSelection()!.addRange(range);
          return true;
        }),
      });
      setMailEditorHeading(editor, tag);
      const block = editor.firstElementChild as HTMLElement;
      expect(block.tagName.toLowerCase()).toBe(tag);
      expect(block.style.fontSize).toBe('');
      expect(block.style.lineHeight).toBe('');
      expect(block.style.color).toBe('red');
      expect(block.querySelector('font')!.style.fontSize).toBe('');
      expect(block.querySelector('font')!.hasAttribute('size')).toBe(false);
      expect(block.querySelector('b')!.textContent).toBe('Heading');
      expect((editor.lastElementChild as HTMLElement).style.fontSize).toBe(
        '32px',
      );
    },
  );
});
