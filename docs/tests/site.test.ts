import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import {
  languageBase,
  localizePath,
  splitLocalizedPath,
} from '../shared/languages.ts';
import { routeToMarkdownPath, sourceToRoute } from '../shared/routes.ts';
import {
  checkLinks,
  fileForPath,
  parseHtmlPage,
} from '../src/integrations/html.ts';
import { buildSitemap } from '../src/integrations/sitemap.ts';
import { extractPageMeta } from '../src/lib/page-meta.ts';
import { normalizeCalloutSyntax } from '../src/markdown/callouts.ts';
import { resolveDocLink } from '../src/markdown/links.ts';

test('source language keys map to public URL bases', () => {
  expect(languageBase('cn')).toBe('/zh-CN/');
  expect(languageBase('en')).toBe('/');
  expect(languageBase('ja')).toBe('/ja/');
  expect(localizePath('cn', '/capabilities/auth/')).toBe(
    '/zh-CN/capabilities/auth/',
  );
  expect(splitLocalizedPath('/zh-CN/capabilities/file')).toEqual({
    language: 'cn',
    route: '/capabilities/file',
  });
  expect(splitLocalizedPath('/capabilities/file')).toEqual({
    language: 'en',
    route: '/capabilities/file',
  });
});

test('source files keep the URL shapes the Rspress site published', () => {
  expect(sourceToRoute('index.md')).toBe('/');
  expect(sourceToRoute('capabilities/auth/index.mdx')).toBe(
    '/capabilities/auth/',
  );
  expect(sourceToRoute('capabilities/file.md')).toBe('/capabilities/file');
  expect(routeToMarkdownPath('/')).toBe('/index.md');
  expect(routeToMarkdownPath('/capabilities/auth/')).toBe(
    '/capabilities/auth/index.md',
  );
  expect(routeToMarkdownPath('/capabilities/file')).toBe(
    '/capabilities/file.md',
  );
});

test('the CDN serves extensionless paths from a directory index', () => {
  expect(fileForPath('/')).toBe('index.html');
  expect(fileForPath('/capabilities/file')).toBe(
    'capabilities/file/index.html',
  );
  expect(fileForPath('/capabilities/auth/')).toBe(
    'capabilities/auth/index.html',
  );
  expect(fileForPath('/capabilities/file.md')).toBe('capabilities/file.md');
});

test('Rspress callout titles become directive labels outside code', () => {
  const source = [
    ':::tip Important notes',
    'Text',
    ':::',
    '```md',
    ':::tip Kept as written',
    '```',
  ].join('\n');
  expect(normalizeCalloutSyntax(source)).toBe(
    [
      ':::tip[Important notes]',
      'Text',
      ':::',
      '```md',
      ':::tip Kept as written',
      '```',
    ].join('\n'),
  );
});

test('the description falls back to the text before the first section', () => {
  const meta = extractPageMeta(
    [
      '# Approval',
      '',
      'First **paragraph** with a [link](./x.md).',
      '',
      '| a | b |',
      '| - | - |',
      '| 1 | 2 |',
      '',
      'Second paragraph.',
      '',
      '## Section',
      '',
      'Not part of it.',
    ].join('\n'),
  );
  expect(meta).toEqual({
    h1: 'Approval',
    lead: 'First paragraph with a link. Second paragraph.',
  });
});

test('links to Markdown files resolve to page URLs, including index.md naming index.mdx', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-links-'));
  try {
    await mkdir(path.join(root, 'cn', 'capabilities', 'auth'), {
      recursive: true,
    });
    await writeFile(
      path.join(root, 'cn', 'capabilities', 'auth', 'index.mdx'),
      '# Auth',
    );
    await writeFile(path.join(root, 'cn', 'capabilities', 'file.md'), '# File');
    const source = path.join(root, 'cn', 'capabilities', 'auth', 'password.md');
    expect(resolveDocLink('./index.md#staff', source, root)).toBe(
      '/zh-CN/capabilities/auth/#staff',
    );
    expect(resolveDocLink('../file.md', source, root)).toBe(
      '/zh-CN/capabilities/file',
    );
    expect(resolveDocLink('./missing.md', source, root)).toBe(undefined);
    expect(resolveDocLink('https://example.com/a.md', source, root)).toBe(
      undefined,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

const page = (file: string, head: string, body = '') =>
  parseHtmlPage(
    file,
    `<html><head>${head}</head><body data-layout="doc">${body}</body></html>`,
  );

test('the sitemap lists indexable pages that are their own canonical URL', () => {
  const origin = 'https://docs.nocobase.com';
  const pages = [
    page(
      'capabilities/file/index.html',
      `<link rel="canonical" href="${origin}/capabilities/file"><link rel="alternate" hreflang="zh-CN" href="${origin}/zh-CN/capabilities/file">`,
    ),
    page('404.html', '<meta name="robots" content="noindex">'),
    page(
      'other/index.html',
      `<link rel="canonical" href="${origin}/capabilities/file">`,
    ),
  ];
  const { xml, count } = buildSitemap(pages);
  expect(count).toBe(1);
  expect(xml).toMatch(
    /<loc>https:\/\/docs\.nocobase\.com\/capabilities\/file<\/loc>/,
  );
  expect(xml).toMatch(
    /hreflang="zh-CN" href="https:\/\/docs\.nocobase\.com\/zh-CN\/capabilities\/file"/,
  );
});

test('the link check reports missing pages and missing headings', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-check-'));
  try {
    const pages = [
      page(
        'a/index.html',
        '',
        '<h2 id="ok">OK</h2><a href="/b">b</a><a href="/a#ok">ok</a><a href="/a#nope">x</a>',
      ),
      page('b/index.html', ''),
    ];
    const problems = checkLinks(root, pages).map(({ href }) => href);
    expect(problems).toEqual(['/a#nope']);
    const missing = checkLinks(root, [
      page('a/index.html', '', '<a href="/gone">gone</a>'),
    ]);
    expect(missing.length).toBe(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
