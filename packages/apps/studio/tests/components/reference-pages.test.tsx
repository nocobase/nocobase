import { render } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeAll, expect, it, vi } from 'vitest';

import appEnUS from '../../client/locales/en-US.ts';
import referenceEnUS from '../../client/pages/reference/locales/en-US.ts';

// A reference page reads its own wording and the handful of application keys shared components use.
const enUS = { ...appEnUS, ...referenceEnUS };

/**
 * Renders every reference page against the real English wording.
 *
 * `locale-coverage.test.ts` reads the keys out of the source and checks them
 * against both locales, which catches a key nobody translated. It cannot catch
 * what only shows up once the page runs: a component that throws, or a string
 * whose placeholder never gets substituted. Single braces are what made that
 * concrete — i18next interpolates `{{name}}` and leaves `{name}` alone, so a
 * page can pass every static check and still print `{customer}` at a reader.
 */

const missing = new Set<string>();

function lookup(key: string): string | undefined {
  // Most keys are nested groups, but the older ones are flat with dots in the
  // name, as `status.loading` is.
  const flat = (enUS as Record<string, unknown>)[key];
  if (typeof flat === 'string') return flat;
  let node: unknown = enUS;
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

// Only `useTranslation` is replaced: the pages read `useLocale` through the
// same module, and the calendar needs the real one.
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    i18n: { language: 'en-US' },
    t: (key: string, options?: Record<string, unknown>) => {
      const template = lookup(key);
      if (template === undefined) {
        missing.add(key);
        return key;
      }
      return template.replace(/\{\{(\w+)\}\}/gu, (whole, name: string) =>
        options && name in options ? String(options[name]) : whole,
      );
    },
  }),
}));

/** A component page is one file; an example is a folder holding its data module. */
function pageFiles(): string[] {
  return [
    'client/pages/reference/components',
    'client/pages/reference/examples',
  ].flatMap((root) =>
    fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
      if (entry.isDirectory()) {
        const page = path.join(root, entry.name, `${entry.name}.tsx`);
        return fs.existsSync(page) ? [page] : [];
      }
      return entry.name.endsWith('.tsx') ? [path.join(root, entry.name)] : [];
    }),
  );
}

// Browser APIs jsdom does not implement, which the carousel, the command
// palette and the drawer all reach for while mounting.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  globalThis.IntersectionObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView = () => {};
});

it.each(pageFiles())('renders %s', async (file) => {
  const before = new Set(missing);
  const mod = (await import(path.resolve(file))) as {
    default: () => ReactElement;
  };
  const Page = mod.default;
  const { container } = render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>,
  );
  const text = container.textContent ?? '';

  expect(
    [...missing].filter((key) => !before.has(key)),
    'keys with no English wording',
  ).toEqual([]);
  expect(
    text.match(/\{\{\w+\}\}/gu),
    'placeholders the page never substituted',
  ).toBeNull();
  expect(text.length, 'rendered text').toBeGreaterThan(80);
});
