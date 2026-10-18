# Documentation Site

Read this before changing anything under `docs/`. It explains how the site is built. The step-by-step guide for writing and adding pages is `docs/README.md`, and `docs/AGENTS.md` holds the short rules for editing documentation content.

## What the site is

`docs/` is the `@nocobase/docs` workspace package: a static site built with plain [Astro](https://astro.build/) (not Starlight), one build for every language. `pnpm --filter @nocobase/docs dev` serves it, `build` writes `docs/dist/`, and `lint`, `typecheck` (`astro check`), `test` (Vitest) and `check:structure` (`check.sh`) are its checks. `lint` runs `astro sync` first: the type-aware rules need the content collection types Astro generates in `.astro/`, which a fresh checkout does not have. The site ships no client-side framework: every page is a static document with a few kilobytes of plain scripts.

Astro and its integrations are pinned to exact versions that had been published for at least two weeks when they were chosen. Upgrade them deliberately, one release at a time, and rebuild and compare the output (see "Checking a change" below).

## Content and languages

Markdown pages live in `docs/docs/<lang>/`, with `_meta.json` (sidebar) and `_nav.json` (top navigation entries used to group `llms.txt`) beside them. Only `en` and `cn` exist. `shared/languages.ts` lists the built languages: `en` is served from `/`, `cn` from `/zh-CN/`. Keep source directories and translation keys as `cn`. A language is built only when it is listed there and has a directory. `cn` is the baseline the structural checks in `check.sh` compare every other language against, so a page added to another language without its `cn` counterpart fails the tree and meta alignment checks. There are no `/cn/*` redirect pages; Chinese lives only under `/zh-CN/`.

The public site contains the homepage, the `nocobase-2-vs-3` comparison, the application deployment guide and the `capabilities/` documentation in each language. Detailed application development, plugin development and advanced deployment procedures belong in the relevant Skills and application guidance. `docs/docs/<lang>/public/` holds downloads the capability pages refer to; the build copies it to that language's base (`/downloads/…`, `/zh-CN/downloads/…`). Screenshots live in `docs/docs/<lang>/capabilities/assets/` (the same files in both languages), are referenced from Markdown with a relative path and are published under `/_astro/` with a hashed name; the capability overviews read the `cn` copy of that directory.

### URLs

A page's URL follows its source path and never changes shape, because every published URL is indexed:

| Source                        | URL                    | Emitted file                      |
| ----------------------------- | ---------------------- | --------------------------------- |
| `docs/en/index.md`            | `/`                    | `index.html`                      |
| `docs/en/x/index.md` (`.mdx`) | `/x/` (trailing slash) | `x/index.html`                    |
| `docs/en/x.md`                | `/x` (no slash)        | `x/index.html`                    |
| `docs/cn/x.md`                | `/zh-CN/x`             | `zh-CN/x/index.html`              |
| any page                      | `<url>.md` copy        | `x.md` or `x/index.md` (see llms) |

`shared/routes.ts` implements these rules. Canonical links, alternates, the sitemap, sidebar links and rewritten Markdown links all use the same shape. Every page is emitted as `<path>/index.html` because the CDN's back-to-origin rules (`scripts/deploy-cdn.mjs`) map an extensionless URL to that file; do not change `build.format`.

### Writing Markdown

- Link to the file you mean, relative to the current file: `[Authorization](../authorization/index.md)`, `[API keys](./api-keys.md#create)`. The build rewrites the link to the page URL; `./index.md` also finds `index.mdx`. Do not write public URLs by hand.
- Callouts use the existing syntax: `:::tip Title` … `:::` (also `info`, `note`, `warning`, `danger`, `caution`, `details`).
- External links open in a new tab automatically.
- Frontmatter: `title` (else the `# Heading`), `description` (else the text before the first `##` section is used, which is what search results and `llms.txt` show — write one when that text is a poor summary) and `keywords`.
- A page keeps a single `# Heading`; the layout renders it with the page actions under it.

Downloads in `public/` and hand-written `.astro` pages have no Markdown source to link to, so Markdown links to them use the public path in the page's language (`/downloads/x.docx`, `/zh-CN/pricing`).

The build fails on a link to a page, file or heading that does not exist. It checks every `<a href>` in the emitted HTML — Markdown links, sidebar links, hand-built markup — and fragments on Markdown pages. `src/integrations/html.ts` is the check.

## Code layout

| Path                                                                        | What it is                                                                                                                   |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `astro.config.ts`                                                           | Markdown pipeline (remark/rehype plugins), output format, the site integration                                               |
| `shared/site.ts`                                                            | `SITE_ORIGIN`: `DOCS_SITE_ORIGIN`, default `https://docs.nocobase.com`; every absolute URL the site emits is built on it     |
| `shared/languages.ts`, `shared/routes.ts`                                   | Languages and URL rules                                                                                                      |
| `src/content.config.ts`                                                     | The `docs` content collection (glob loader over `docs/<lang>/`)                                                              |
| `src/lib/pages.ts`                                                          | The page model: route, title, description, kind (`doc`, `home`, `comparison`, `capability-overview`, `deployment`)           |
| `src/lib/sidebar.ts`                                                        | Sidebars from `_meta.json`, previous/next order                                                                              |
| `src/lib/llms.ts`                                                           | `llms.txt`, `llms-full.txt`, per-page `.md` copies                                                                           |
| `src/markdown/`                                                             | Remark/rehype plugins: callouts, link rewriting, heading anchors, table wrapper                                              |
| `src/layouts/BaseLayout.astro`                                              | `<html>`, the SEO head (`src/components/SeoHead.astro`), header, footer                                                      |
| `src/layouts/DocLayout.astro`                                               | Markdown pages: sidebar, title and page actions, TOC, previous/next, JSON-LD                                                 |
| `src/components/{FullHome,ArchitecturePitch,CapabilityOverview,Deployment}` | The hand-built pages: static markup in JSON, their styles and scripts                                                        |
| `src/pages/`                                                                | Routes: `[...slug].astro` (Markdown pages), `[...base]/…` (hand-built pages, llms files), `[...path].md.ts`, `robots.txt.ts` |
| `src/integrations/`                                                         | After the build: copy `public/`, localized 404, link check, `sitemap.xml`, Pagefind index                                    |

Each kind of page has its own route file because Astro bundles the styles of every component a route file imports into every page that route builds.

### Hand-built page copy

The home page, the comparison and the capability overviews render HTML stored as JSON strings. In `FullHome/markup*.json`, `FullHome/data*.json`, `ArchitecturePitch/markup*.json` and `CapabilityOverview/pages*.json`, the file without a suffix is Chinese and `.en.json` is English; the header names both, `SiteHeader/header.cn.json` and `header.en.json`. The header JSON is used on every page except the home page, whose top bar is part of its markup; `SiteFooter/index.astro` is the footer of Markdown pages, the comparison and hand-written pages, while the home page and the overviews carry their footer in their markup. `FullHome/data*.json` also holds the prompt library the overviews' scenario pickers use.

Each of these pages keeps a Markdown twin (`docs/<lang>/index.md`, `nocobase-2-vs-3.mdx`, `capabilities/<module>/index.md(x)` or `capabilities/<module>.md`). Its body is never rendered: the twin's frontmatter supplies the page's title, description and keywords, and its body supplies the `.md` copy and `llms.txt`. A change to the visible copy goes into the JSON, and the twin is updated to match.

The deployment page uses `pageName: deployment` and the `deployment` page kind to render `src/components/Deployment` through its own Astro route. Keep its localized `content*.json`, command blocks and anchors aligned with `docs/<lang>/deployment.md`, which supplies search and LLM-readable content. Preserve the homepage’s light palette, grid illustration, blue Agent panels and centered accessible PM2/Docker tabs. Show the shared example environment once above the tabs, collapsed by default; keep the optional Agent prompt first in each tab and expanded by default. Section links must activate their tab and reveal containing disclosures, including legacy anchors. Keep first deployment, verification and updates visible, label where commands run, and leave advanced recovery and CI/CD to the relevant Skills.

## Adding a page

- **A Markdown page**: add the file under `docs/<lang>/` in every language and list it in the directory's `_meta.json`. Nothing else.
- **A hand-written page** (HTML or `.astro`, no Markdown): create `src/pages/<path>.astro` for English and `src/pages/zh-CN/<path>.astro` for Chinese, and wrap the content in `BaseLayout`:

  ```astro
  ---
  import BaseLayout from '../layouts/BaseLayout.astro';
  ---

  <BaseLayout language='en' route='/pricing' title='Pricing' description='…'>
    <main>…</main>
  </BaseLayout>
  ```

  `route` is the language-neutral URL in its exact slash shape. The layout adds the header, footer, `<title>` (`Pricing - NocoBase Documentation`), description, canonical, `hreflang` alternates (pass `translations={['en']}` if the page has no Chinese version), Open Graph tags and robots meta; the sitemap picks the page up from the emitted HTML. Set `header={false}` or `footer={false}` only when the page's own markup carries them. Such a page has no `.md` copy and is not in `llms.txt`.

  Keep the page's markup, styles, scripts and assets in a component of its own (`src/components/<Name>/index.astro` with an `assets/` directory) imported only by its route files, so they ship with that page alone; mark its content `data-pagefind-body` to include it in the search index. Link to it from the header JSON and, in Markdown, by public path. The sidebar is for Markdown pages: `scripts/normalize-doc-links.mjs` reports a `_meta.json` link to a hand-written page as dead.

- **A hand-built page with a Markdown twin** (like the home page and capability overviews): keep a Markdown source under `docs/<lang>/` for `llms.txt` and the `.md` copy, give it a `PageKind` in `src/lib/pages.ts`, and add a route file that renders the markup for that kind.

## SEO and machine-readable outputs

- Every page: `<title>`, `description`, `keywords` when set, `robots` (`index,follow`; `noindex` on 404), canonical, `hreflang` for `en-US`, `zh-CN` and `x-default` (English) when the page exists in that language, Open Graph and Twitter tags. Markdown pages add `TechArticle` and `BreadcrumbList` JSON-LD.
- `sitemap.xml`: every emitted page that is indexable and its own canonical URL, English and Chinese, each with its alternates. It is generated from the HTML after the build.
- `robots.txt`: allows everything and points at the sitemap.
- `llms.txt`, `llms-full.txt`, `zh-CN/llms.txt`, `zh-CN/llms-full.txt`: grouped by `_nav.json`, in sidebar order. Each page also has a Markdown copy at `<url>.md` (`/capabilities/file.md`, `/capabilities/auth/index.md`): its source without frontmatter, links pointing at other `.md` copies. The Copy Markdown button fetches that file.

## Search

The build writes a [Pagefind](https://pagefind.app/) index to `dist/pagefind/` (one index per language, Chinese segmented), covering the Markdown pages, the comparison and the capability overviews (`data-pagefind-body`). No page loads it yet. To add search, load `/pagefind/pagefind.js` (or Pagefind's UI bundle) on demand from a search entry in the header, so pages that are never searched pay nothing; results come back as `/x/` paths, which the CDN serves.

## Styling

`src/styles/global.css` is the reset the hand-built pages were designed on and the site's colour tokens; `src/styles/doc.css` styles Markdown pages. The site is light only. `src/styles/legacy-typography.css` keeps the Nunito headings the home page and the comparison inherited from the previous theme; drop it when those pages are redesigned.

## Toolchain

Prettier uses `@nocobase/dev-config/prettier` plus `prettier-plugin-astro` (`docs/prettier.config.js`). ESLint uses the shared `createNodeLibraryConfig` plus `eslint-plugin-astro` (`docs/eslint.config.js`), with browser globals for the client scripts. The root ESLint configuration matches nothing in `docs/`, so `lint-staged.config.mjs` lists it in `SELF_LINTING_DIRECTORIES` and runs its own ESLint; `pnpm lint` at the root runs the package's `lint` script. `.astro` files are linted and formatted by both entry points.

## Checking a change

- `pnpm --filter @nocobase/docs lint`, `typecheck`, `test`, `build` and `./check.sh` in `docs/`. The build itself fails on broken links. Without a terminal on stdin, `check.sh` reads a changed-file list from stdin for its i18n coverage check and waits for it; run it as `./check.sh < /dev/null` from a script or an agent.
- For a change to layout, styles or output paths, build before and after and compare the `dist/` trees and, visually, the pages you touched at 1440 and 390 px wide.

## Deployment

`.github/workflows/v3-docs.yml` checks the structure, lints, typechecks, tests and builds on every pull request touching `docs/`; on `v3-develop` pushes and on a `workflow_dispatch` with `publish` it uploads `dist/` to a timestamped OSS directory, copies `dist/404.html` to the bucket root and runs `scripts/deploy-cdn.mjs` to point the CDN at it. The CDN rules are the contract the output layout keeps: change one only together with the other.
