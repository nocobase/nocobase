import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { tsImport } from 'tsx/esm/api';

import { flattenValues, SUPPORTED_LOCALES } from '../../scripts/i18n-check.mjs';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const { I18nRuntime } = await tsImport(
  path.join(repoRoot, 'packages/libs/i18n/src/core/runtime.ts'),
  import.meta.url,
);
const { Hono } = await import('hono');
const { createI18nMiddleware, getRequestTranslator, getRequestLocale } =
  await tsImport(
    path.join(repoRoot, 'packages/libs/i18n/src/server/middleware.ts'),
    import.meta.url,
  );

for (const section of ['plugins', 'examples', 'libs']) {
  const root = path.join(repoRoot, 'packages', section);
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const base = path.join(root, entry.name);
    for (const side of ['client', 'server']) {
      const directory = path.join(base, side, 'locales');
      const files = await readdir(directory).catch(() => []);
      if (!files.includes('en-US.ts') || !files.includes('index.ts')) continue;
      test(`${entry.name} ${side}: all locales load and translate without language or namespace fallback`, async () => {
        const { name: namespace } = JSON.parse(
          await readFile(path.join(base, 'package.json'), 'utf8'),
        );
        const { default: loaders } = await tsImport(
          path.join(directory, 'index.ts'),
          import.meta.url,
        );
        assert.deepEqual(Object.keys(loaders), SUPPORTED_LOCALES);
        const runtime = new I18nRuntime({
          defaultLocale: 'en-US',
          locales: SUPPORTED_LOCALES,
        });
        runtime.registerNamespace(namespace, loaders);
        await runtime.init('en-US');
        const source = flattenValues((await loaders['en-US']()).default);
        const router = new Hono();
        router.use('*', createI18nMiddleware(runtime, { namespace }));
        const key = Object.keys(source).find(
          (name) => !/_(one|other)$/u.test(name),
        );
        router.get('/', (context) =>
          context.json({
            locale: getRequestLocale(context),
            message: getRequestTranslator(context, namespace)(key),
          }),
        );
        for (const locale of SUPPORTED_LOCALES) {
          await runtime.changeLanguage(locale);
          const copy = flattenValues((await loaders[locale]()).default);
          for (const [name, text] of Object.entries(copy)) {
            const params = {};
            for (const match of text.matchAll(/\{\{\s*([^}]+?)\s*\}\}/gu)) {
              const segments = match[1].split('.');
              let node = params;
              for (const segment of segments.slice(0, -1))
                node = node[segment] ??= {};
              node[segments.at(-1)] = 'VALUE';
            }
            const translated = runtime.i18n.t(name, {
              ...params,
              lng: locale,
              ns: namespace,
              returnDetails: true,
            });
            assert.equal(translated.usedLng, locale, `${locale}:${name}`);
            assert.equal(translated.usedNS, namespace, name);
            assert.ok(
              !translated.res.includes('{{'),
              `${locale}:${name}: unresolved interpolation`,
            );
          }
          const bases = Object.keys(source)
            .filter((name) => name.endsWith('_other'))
            .map((name) => name.slice(0, -6));
          for (const baseKey of bases)
            for (const count of [0, 1, 2, 5, 1_000_000]) {
              const translated = runtime.i18n.t(baseKey, {
                lng: locale,
                ns: namespace,
                count,
                returnDetails: true,
              });
              assert.equal(
                translated.usedLng,
                locale,
                `${locale}:${baseKey}:${count}`,
              );
              assert.equal(
                translated.exactUsedKey,
                `${baseKey}_${count === 0 && `${baseKey}_zero` in copy ? 'zero' : new Intl.PluralRules(locale).select(count)}`,
              );
            }
          if (side === 'server') {
            const response = await router.request('/', {
              headers: { 'Accept-Language': locale },
            });
            assert.equal(response.status, 200);
            const result = await response.json();
            assert.equal(result.locale, locale);
            assert.equal(
              result.message,
              runtime.getFixedT(namespace, locale)(key),
            );
          }
        }
        runtime.i18n.off();
      });
    }
  }
}
