import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyText, createUuid } from '../src/index.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'execCommand');
  document.body.replaceChildren();
  document.getSelection()?.removeAllRanges();
});

describe('createUuid', () => {
  it('creates distinct UUID v4 values without randomUUID on HTTP', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });
    const ids = Array.from({ length: 100 }, () => createUuid());
    for (const id of ids)
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
      );
    expect(new Set(ids).size).toBe(ids.length);
  });
});

function clipboard(value: unknown): void {
  vi.stubGlobal('navigator', { clipboard: value });
}

// jsdom has neither clipboard writes nor execCommand; model their observable browser outcomes.
function command(implementation: () => boolean) {
  const mock = vi.fn(implementation);
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: mock,
  });
  return mock;
}

describe('copyText', () => {
  it('reports successful Clipboard API writes without moving focus', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard({ writeText });
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();
    expect(await copyText('你好\nsecond line')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('你好\nsecond line');
    expect(document.activeElement).toBe(button);
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('copies synchronously without the Clipboard API and restores the input selection', async () => {
    clipboard(undefined);
    const input = document.createElement('input');
    input.value = 'original selection';
    document.body.append(input);
    input.focus();
    input.setSelectionRange(2, 8, 'backward');
    const exec = command(() => {
      const field = document.activeElement as HTMLTextAreaElement;
      expect(field.tagName).toBe('TEXTAREA');
      expect(field.value).toBe('第一行\nsecond line 😀');
      expect(field.selectionStart).toBe(0);
      expect(field.selectionEnd).toBe(field.value.length);
      return true;
    });
    const pending = copyText('第一行\nsecond line 😀');
    expect(exec).toHaveBeenCalledWith('copy');
    expect(document.activeElement).toBe(input);
    expect([
      input.selectionStart,
      input.selectionEnd,
      input.selectionDirection,
    ]).toEqual([2, 8, 'backward']);
    expect(document.querySelector('textarea')).toBeNull();
    expect(await pending).toBe(true);
  });

  it('falls back after Clipboard API permission rejection', async () => {
    clipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    const exec = command(() => true);
    expect(await copyText('copy me')).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it.each(['false', 'throw'])(
    'returns false and cleans up when fallback copying fails (%s)',
    async (failure) => {
      clipboard(undefined);
      const button = document.createElement('button');
      document.body.append(button);
      button.focus();
      command(() => {
        if (failure === 'throw') throw new Error('denied');
        return false;
      });
      expect(await copyText('unavailable')).toBe(false);
      expect(document.activeElement).toBe(button);
      expect(document.querySelector('textarea')).toBeNull();
    },
  );

  it('copies inside the active dialog focus scope and restores document selection', async () => {
    clipboard(undefined);
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const button = document.createElement('button');
    button.textContent = 'Copy';
    dialog.append(button);
    document.body.append(dialog);
    button.focus();
    const range = document.createRange();
    range.selectNodeContents(button);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
    expect(document.getSelection()!.toString()).toBe('Copy');
    command(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
      return true;
    });
    expect(await copyText('dialog content')).toBe(true);
    expect(document.activeElement).toBe(button);
    expect(document.getSelection()!.toString()).toBe('Copy');
    expect(dialog.querySelector('textarea')).toBeNull();
  });

  it('uses an explicit container when the copy trigger does not take focus', async () => {
    clipboard(undefined);
    const container = document.createElement('div');
    document.body.append(container);
    command(() => {
      expect(container.contains(document.activeElement)).toBe(true);
      return true;
    });
    expect(await copyText('value', { container })).toBe(true);
    expect(container.childElementCount).toBe(0);
  });

  it('returns false when neither copying mechanism is available', async () => {
    clipboard(undefined);
    expect(await copyText('manual copy required')).toBe(false);
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('returns false without a browser document', async () => {
    vi.stubGlobal('document', undefined);
    expect(await copyText('server render')).toBe(false);
  });
});
