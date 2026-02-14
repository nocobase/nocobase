/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetRunJSSafeGlobalsRegistryForTests,
  createSafeDocument,
  createSafeNavigator,
  createSafeWindow,
  registerRunJSSafeDocumentGlobals,
  registerRunJSSafeWindowGlobals,
} from '../safeGlobals';

beforeEach(() => {
  __resetRunJSSafeGlobalsRegistryForTests();
});

describe('safeGlobals', () => {
  it('createSafeWindow exposes only allowed globals and extras', () => {
    const win: any = createSafeWindow({ foo: 123 });
    expect(typeof win.setTimeout).toBe('function');
    expect(win.console).toBeDefined();
    expect(win.foo).toBe(123);
    expect(new win.FormData()).toBeInstanceOf(window.FormData);
    if (typeof window.Blob !== 'undefined') {
      expect(typeof win.Blob).toBe('function');
      expect(new win.Blob(['x'])).toBeInstanceOf(window.Blob);
    }
    if (typeof window.URL !== 'undefined') {
      expect(win.URL).toBe(window.URL);
      expect(typeof win.URL.createObjectURL).toBe('function');
    }
    // access to location proxy is allowed, but sensitive props throw
    expect(() => win.location.href).toThrow(/not allowed/);
  });

  it('createSafeWindow allows writing new props and reading them back', () => {
    const win: any = createSafeWindow();
    win.someLib = { ok: true };
    expect(win.someLib).toEqual({ ok: true });
    expect('someLib' in win).toBe(true);
  });

  it('createSafeWindow can access dynamically registered globals from real window', () => {
    const key = '__nb_safe_window_global__';
    (window as any)[key] = { v: 1 };
    registerRunJSSafeWindowGlobals([key]);

    const win: any = createSafeWindow();
    expect(win[key]).toEqual({ v: 1 });

    delete (window as any)[key];
  });

  it('createSafeDocument exposes whitelisted methods and extras', () => {
    const doc: any = createSafeDocument({ bar: true });
    expect(typeof doc.createElement).toBe('function');
    expect(doc.bar).toBe(true);
    expect(() => doc.cookie).toThrow(/not allowed/);
  });

  it('createSafeDocument allows writing new props and reading them back', () => {
    const doc: any = createSafeDocument();
    doc.someLib = { ok: true };
    expect(doc.someLib).toEqual({ ok: true });
    expect('someLib' in doc).toBe(true);
  });

  it('createSafeDocument can access dynamically registered globals from real document', () => {
    const key = '__nb_safe_document_global__';
    (document as any)[key] = 123;
    registerRunJSSafeDocumentGlobals([key]);

    const doc: any = createSafeDocument();
    expect(doc[key]).toBe(123);

    delete (document as any)[key];
  });

  it('createSafeNavigator exposes limited props and guards others', () => {
    const nav: any = createSafeNavigator();
    // clipboard object should always exist
    expect(typeof nav.clipboard).toBe('object');
    // writeText may or may not exist depending on environment
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
      expect(typeof nav.clipboard.writeText).toBe('function');
    } else {
      expect(typeof nav.clipboard.writeText === 'undefined' || typeof nav.clipboard.writeText === 'function').toBe(
        true,
      );
    }
    // readable properties
    expect(() => void nav.onLine).not.toThrow();
    expect(() => void nav.language).not.toThrow();
    expect(() => void nav.languages).not.toThrow();
    // blocked properties
    expect(() => (nav as any).geolocation).toThrow(/not allowed/);
    expect(() => (nav as any).userAgent).toThrow(/not allowed/);
  });
});
