import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { themePresets } from '../../client/theme/theme-presets';
import {
  initializeTheme,
  themeStorageKeys,
} from '../../client/theme/theme-preferences';

describe('application appearance storage', () => {
  it('lists Compact first as the default preset', () => {
    expect(themePresets[0].id).toBe('compact');
  });
  it('restores Compact when the saved Ant Design preset is removed', () => {
    const keys = themeStorageKeys('/crm/');
    localStorage.setItem(keys.preset, 'ant-design');
    localStorage.setItem(keys.mode, 'light');
    initializeTheme(
      '/crm/',
      themePresets.map(({ id }) => id),
    );
    expect(document.documentElement.dataset.theme).toBe('compact');
    expect(document.documentElement).toHaveClass('light');
  });
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('class');
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
  });

  it('uses the first registered preset as the fallback', () => {
    initializeTheme('/crm/', ['custom', 'default']);
    expect(document.documentElement.dataset.theme).toBe('custom');
  });

  it('separates apps, preserves nested paths and distinguishes the root', () => {
    expect(themeStorageKeys('/crm/').mode).toBe(
      'nocobase:crm:theme:color-scheme',
    );
    expect(themeStorageKeys('/crm').preset).toBe('nocobase:crm:theme:preset');
    expect(themeStorageKeys('/team/crm/').preset).toBe(
      'nocobase:team%2Fcrm:theme:preset',
    );
    expect(themeStorageKeys('/').preset).toBe('nocobase:%2F:theme:preset');
    expect(themeStorageKeys('/root/')).not.toEqual(themeStorageKeys('/'));
  });

  it('restores both preferences before React without reading another app', () => {
    localStorage.setItem('nocobase:crm:theme:color-scheme', 'light');
    localStorage.setItem('nocobase:crm:theme:preset', 'default');
    initializeTheme(
      '/crm/',
      themePresets.map(({ id }) => id),
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'default');
    expect(document.documentElement).toHaveClass('light');
    initializeTheme(
      '/erp/',
      themePresets.map(({ id }) => id),
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'compact');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('falls back on invalid values and unavailable storage', () => {
    localStorage.setItem('nocobase:crm:theme:color-scheme', 'invalid');
    localStorage.setItem('nocobase:crm:theme:preset', 'deleted');
    initializeTheme(
      '/crm/',
      themePresets.map(({ id }) => id),
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'compact');
    expect(document.documentElement).toHaveClass('dark');
    const spy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    expect(() =>
      initializeTheme(
        '/crm/',
        themePresets.map(({ id }) => id),
      ),
    ).not.toThrow();
    spy.mockRestore();
  });
});
