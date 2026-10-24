import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText, createBrowserId } from '../src/browser.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('HTTP browser utilities', () => {
  it('creates UUID v4 values using only getRandomValues', () => {
    const getRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal('crypto', { getRandomValues });
    const ids = Array.from({ length: 1000 }, () => createBrowserId());
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids)
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
      );
  });

  it('uses the modern clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      get: () => ({ writeText }),
    });
    await copyText('hello');
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it.each(['missing', 'denied'])(
    'copies with a %s clipboard and restores modal focus',
    async (mode) => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        get: () =>
          mode === 'missing'
            ? undefined
            : { writeText: () => Promise.reject(new Error('Denied')) },
      });
      const modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      const button = document.createElement('button');
      modal.append(button);
      document.body.append(modal);
      button.focus();
      const exec = vi.fn(() => {
        expect(modal.querySelector('textarea')?.value).toBe('hello');
        return true;
      });
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: exec,
      });
      await copyText('hello');
      expect(exec).toHaveBeenCalledWith('copy');
      expect(document.activeElement).toBe(button);
      expect(modal.querySelector('textarea')).toBeNull();
    },
  );

  it('reports an unavailable fallback and cleans up', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      get: () => undefined,
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: () => false,
    });
    await expect(copyText('hello')).rejects.toThrow('Could not copy');
    expect(document.querySelector('textarea')).toBeNull();
  });
});
