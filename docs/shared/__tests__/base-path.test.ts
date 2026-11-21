import assert from 'node:assert/strict';
import { test } from 'node:test';
import { removeBase, withBase } from '@rspress/shared';

test('Russian RunJS links receive a complete language prefix', () => {
  for (const page of ['set-value', 'get-value', 'form']) {
    const route = `/runjs/context/${page}`;
    const href = `/ru${route}`;
    assert.equal(withBase(route, '/ru/'), href);
    assert.equal(withBase(href, '/ru/'), href);
    assert.equal(removeBase(href, '/ru/'), route);
    // The router may already have removed the language base.
    assert.equal(removeBase(route, '/ru/'), route);
  }
});

test('language switching preserves the RunJS path', () => {
  for (const pathname of [
    '/ru/runjs/context/set-value',
    '/runjs/context/set-value',
  ]) {
    const pagePath = removeBase(pathname, '/ru/');
    assert.equal(pagePath, '/runjs/context/set-value');
    assert.equal(`/cn${pagePath}`, '/cn/runjs/context/set-value');
  }
});

test('root and other language bases retain their behavior', () => {
  for (const base of ['/', '/cn/', '/ja/', '/ru/']) {
    const route = '/runjs/context/get-value';
    const href = `${base.slice(0, -1)}${route}`;
    assert.equal(withBase(route, base), href);
    assert.equal(removeBase(href, base), route);
    assert.equal(withBase(base, base), base);
    assert.equal(removeBase(base, base), '/');
  }
});
