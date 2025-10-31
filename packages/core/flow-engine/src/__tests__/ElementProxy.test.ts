/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { ElementProxy } from '../ElementProxy';

describe('ElementProxy', () => {
  it('proxies element methods and properties', () => {
    const el = document.createElement('div');
    const proxy: any = new ElementProxy(el);

    proxy.setAttribute('data-x', '1');
    expect(el.getAttribute('data-x')).toBe('1');

    proxy.id = 'abc';
    expect(el.id).toBe('abc');
    expect(proxy.id).toBe('abc');
  });

  it('sanitizes innerHTML/outerHTML setters', () => {
    const el = document.createElement('div');
    const proxy: any = new ElementProxy(el);

    proxy.innerHTML = '<img src=x onerror=alert(1)><span>ok</span>';
    expect(proxy.innerHTML).toContain('<span>ok</span>');
    expect(proxy.innerHTML).not.toContain('onerror');

    const container = document.createElement('div');
    container.appendChild(el);
    proxy.outerHTML = '<div onload=1>unsafe</div>';
    expect(container.innerHTML).toContain('unsafe');
    expect(container.innerHTML).not.toContain('onload');
  });

  it('appendChild accepts string or HTMLElement', () => {
    const el = document.createElement('div');
    const proxy: any = new ElementProxy(el);
    proxy.appendChild('hello');
    const span = document.createElement('span');
    span.textContent = 'world';
    proxy.appendChild(span);
    expect(el.textContent).toContain('hello');
    expect(el.querySelector('span')?.textContent).toBe('world');
  });
});
