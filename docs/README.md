# NocoBase Documentation

The NocoBase 3 documentation site, built with [Astro](https://astro.build/). It is a workspace package (`@nocobase/docs`), so `pnpm install` at the repository root installs its dependencies along with everything else.

This README is the guide for people who write and update the documentation. How the site is built internally is in [`.agents/rules/docs-site.md`](../.agents/rules/docs-site.md); you only need it when you change the framework itself.

All paths below are relative to this directory (`docs/` in the repository). The Markdown content is in `docs/<lang>/` here, which is `docs/docs/<lang>/` from the repository root.

## Contents

- [Quick start](#quick-start)
- [Which files to edit](#which-files-to-edit)
- [Writing Markdown](#writing-markdown)
- [Adding a Markdown page](#adding-a-markdown-page)
- [Adding a hand-written page](#adding-a-hand-written-page)
- [Changing the home page, the comparison, an overview, the header or the footer](#changing-the-home-page-the-comparison-an-overview-the-header-or-the-footer)
- [Previewing and checking](#previewing-and-checking)
- [Publishing](#publishing)
- [Pitfalls](#pitfalls)

## Quick start

```bash
pnpm --filter @nocobase/docs dev       # http://localhost:4321/ (English) and http://localhost:4321/zh-CN/ (Chinese)
pnpm --filter @nocobase/docs build     # writes docs/dist/, fails on broken links
pnpm --filter @nocobase/docs preview   # serves docs/dist/
```

One build writes every language: English (`docs/en/`) to `dist/`, Simplified Chinese (`docs/cn/`) to `dist/zh-CN/`. Only these two languages exist. The source directory and translation key of Chinese is `cn`; its public URLs are under `/zh-CN/`.

## Which files to edit

### Documentation content (day-to-day writing)

| What                                | Where                              | Notes                                                                                                                                                                                                           |
| ----------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages                               | `docs/<lang>/**/*.md`, `*.mdx`     | One file per page, in both `en` and `cn`. The file path decides the URL (see [URLs](#urls)).                                                                                                                    |
| Sidebar order, labels and groups    | `_meta.json` in each directory     | Lists the directory's pages (`"type": "file"`) and subdirectories (`"type": "dir"`). Set `"collapsed": true` on every group, in both languages. A directory without `_meta.json` lists its pages in file order. |
| Top navigation groups of `llms.txt` | `docs/<lang>/_nav.json`            | Its internal links (`/capabilities/quick-start`, `/capabilities/`) decide which section of `llms.txt` and `llms-full.txt` a page is listed under. It does not render a menu on the site.                        |
| Screenshots and other images        | `docs/<lang>/capabilities/assets/` | Referenced from Markdown with a relative path, `![Alt text](../assets/name.png)`. The build publishes each referenced image under `/_astro/` with a hashed name. Both languages keep the same files.            |
| Downloadable files                  | `docs/<lang>/public/`              | Copied as they are to the language's base: `docs/en/public/downloads/x.docx` is served at `/downloads/x.docx`, `docs/cn/public/downloads/x.docx` at `/zh-CN/downloads/x.docx`.                                  |

### Copy of the hand-built pages

The deployment guide lives in `src/components/Deployment/`: edit `content.json` (Chinese) and `content.en.json` (English), then synchronize the commands and anchors in `docs/<lang>/deployment.md`. Its dedicated Astro route renders the PM2, Docker and NocoBase Studio tabs; the Markdown twin supplies the downloadable copy and LLM outputs.

The Studio user guide at `/studio` and `/zh-CN/studio` lives in `src/components/StudioGuide/`. Edit `content.json` (Chinese) and `content.en.json` (English) together. The guide follows six chapters (Studio, Runner Agent, Git, projects, issues, and Studio CLI). Each chapter has `sections`; a section can have `topics` for a third navigation level. Keep their IDs aligned between languages and preserve existing fragment links. Section and topic HTML references screenshots in `assets/`, which the component imports into the build. Redact credentials in screenshots before adding them. Its styles and browser interactions stay in the same directory. These hand-written pages are searchable and included in the sitemap, with no Markdown twin.

The home page, the NocoBase 2 vs 3 comparison and the 14 capability overviews are not rendered from Markdown. Their visible text lives in JSON files next to their components. **Files without a language suffix are Chinese; `.en.json` files are English.** The header is the exception and names both: `header.cn.json` and `header.en.json`.

| Page                                                                                                             | Chinese                                                              | English                                           |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| Home page markup (hero, sections, its own top bar and footer)                                                    | `src/components/FullHome/markup.json`                                | `src/components/FullHome/markup.en.json`          |
| Home page data (capability cards, icons, the prompt library the home page and the overviews share)               | `src/components/FullHome/data.json`                                  | `src/components/FullHome/data.en.json`            |
| NocoBase 2 vs 3 comparison                                                                                       | `src/components/ArchitecturePitch/markup.json`                       | `src/components/ArchitecturePitch/markup.en.json` |
| Comparison images                                                                                                | `src/components/ArchitecturePitch/assets/` (shared)                  | same                                              |
| Capability overviews (`/capabilities/<module>`), one entry per module with `markup`, `scenarios` and `promptKey` | `src/components/CapabilityOverview/pages.json`                       | `src/components/CapabilityOverview/pages.en.json` |
| Site header (every page except the home page)                                                                    | `src/components/SiteHeader/header.cn.json`                           | `src/components/SiteHeader/header.en.json`        |
| Site footer (Markdown pages, the comparison, hand-written pages)                                                 | `src/components/SiteFooter/index.astro` (both languages in one file) | same                                              |

The markup files hold HTML as a JSON string. Edit the text inside the string and keep the quotes escaped (`\"`); a JSON-aware editor helps.

### Framework (normally untouched)

| Path                                             | What it does                                                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `astro.config.ts`                                | Astro configuration: the Markdown pipeline and the output format (`build.format: 'directory'`, which the CDN depends on).                              |
| `shared/`                                        | Languages and their URL bases (`languages.ts`), the source-path-to-URL rules (`routes.ts`), the site origin (`site.ts`).                               |
| `src/layouts/`                                   | `BaseLayout.astro` (the HTML document, SEO head, header, footer) and `DocLayout.astro` (sidebar, table of contents, previous/next for Markdown pages). |
| `src/lib/`                                       | The page model (`pages.ts`), sidebars from `_meta.json` (`sidebar.ts`), `llms.txt` and `.md` copies (`llms.ts`).                                       |
| `src/markdown/`                                  | Markdown plugins: callouts, link rewriting, heading anchors, table wrapper.                                                                            |
| `src/integrations/`                              | Post-build steps: copying `public/`, the link check, `sitemap.xml`, the Pagefind search index.                                                         |
| `src/pages/`                                     | Route files. `[...slug].astro` renders Markdown pages; `[...base]/` renders the home page, the comparison, the overviews and `llms.txt`.               |
| `src/components/`, `src/styles/`, `src/scripts/` | Components, CSS and the small client scripts.                                                                                                          |
| `scripts/`                                       | The structural checks `check.sh` runs and `deploy-cdn.mjs`; see [`scripts/README.md`](scripts/README.md).                                              |
| `tests/`                                         | Vitest tests for URL rules, link resolution, the link check and the sitemap.                                                                           |
| `../.github/workflows/v3-docs.yml`               | CI checks and publishing (see [Publishing](#publishing)).                                                                                              |

Details on all of these are in [`.agents/rules/docs-site.md`](../.agents/rules/docs-site.md).

## Writing Markdown

- **Link to the source file, relative to the current file**: `[Authorization](../authorization/index.md)`, `[API keys](./api-keys.md#create)`. The build turns this into the page URL in the right language and shape. `./index.md` also finds `index.mdx`. Do not write public URLs such as `/capabilities/auth/` or `https://docs.nocobase.com/...` for other documentation pages.
- **Callouts**: `:::tip Title` … `:::`. Also `info`, `note`, `warning`, `danger`, `caution` and `details` (a collapsible block). The title is optional.
- **External links** (`https://…`) open in a new tab automatically.
- **Images**: `![Alt text](../assets/name.png)`, relative to the Markdown file. Always write alt text.
- **Downloads** from `public/` are the one place you write a site path: `[Template](/downloads/x.docx)` in English, `[模板](/zh-CN/downloads/x.docx)` in Chinese.
- **Frontmatter**:

  ```markdown
  ---
  title: 'API keys'
  description: 'Create API keys so scripts and other systems can call the application.'
  keywords: 'NocoBase 3,API keys,authentication'
  ---
  ```

  `title` falls back to the `# Heading`. `description` falls back to the text between the `# Heading` and the first `##` section; that text is what search results and `llms.txt` show, so write a `description` when it is a poor summary. `keywords` is optional. `pageName` is reserved for the pages that render hand-built markup; do not set it on ordinary pages.

- **One `# Heading` per page.** The layout renders it with the page actions (copy Markdown and so on) under it. `##` and `###` headings form the table of contents and get anchors you can link to (`./page.md#heading-id`).
- **Broken links fail the build.** Every internal link in the emitted HTML must reach an existing page or file, and a `#fragment` pointing at a Markdown page must name an existing heading.

### URLs

A page's URL follows its source path and must keep its shape once published, because published URLs are indexed:

| Source               | URL                |
| -------------------- | ------------------ |
| `docs/en/x/index.md` | `/x/` (with slash) |
| `docs/en/x.md`       | `/x` (no slash)    |
| `docs/cn/x.md`       | `/zh-CN/x`         |

Every page also has a Markdown copy at `<url>.md` (`/x.md`, `/x/index.md`), which the "Copy Markdown" button and `llms.txt` use. Renaming or moving a file changes its URL; avoid it for published pages.

## Adding a Markdown page

1. Create the page in both languages at the same path, for example `docs/en/capabilities/auth/sso.md` and `docs/cn/capabilities/auth/sso.md`. Start each with frontmatter and a single `# Heading`. `cn` is the baseline the structural checks compare against, so a page that exists only in `en` fails `check.sh`.
2. Add it to the `_meta.json` of its directory, in both languages, at the position it should appear:

   ```json
   { "type": "file", "name": "sso", "label": "Single sign-on" }
   ```

   `name` is the file name without extension (`index` for `index.md`). For a new subdirectory, add `{ "type": "dir", "name": "<dir>", "label": "…", "collapsed": true }` and give the directory its own `_meta.json`.

3. Put any screenshots in `docs/<lang>/capabilities/assets/` (both languages) and reference them relatively.
4. Link to the page from related pages with relative `.md` links.
5. Preview it with `pnpm --filter @nocobase/docs dev` at `http://localhost:4321/capabilities/auth/sso` and `http://localhost:4321/zh-CN/capabilities/auth/sso`.
6. Run `pnpm --filter @nocobase/docs build` (catches broken links) and `cd docs && ./check.sh` (structure and alignment).

Nothing else needs registering: the sidebar, previous/next links, sitemap, `llms.txt`, the `.md` copy and the search index pick the page up.

## Adding a hand-written page

Use this for a page whose layout Markdown cannot express, such as a landing or pricing page. It is an `.astro` file (HTML with a frontmatter script) wrapped in `BaseLayout`.

### 1. Create the route files

| Language | Route file                      | URL              |
| -------- | ------------------------------- | ---------------- |
| English  | `src/pages/pricing.astro`       | `/pricing`       |
| Chinese  | `src/pages/zh-CN/pricing.astro` | `/zh-CN/pricing` |

Use `src/pages/pricing/index.astro` (and `src/pages/zh-CN/pricing/index.astro`) with `route='/pricing/'` if you want the trailing-slash shape. Either way the page is emitted as `dist/pricing/index.html`. Pick a path no Markdown page uses.

### 2. Put the page content in a component

Keep the markup, styles and scripts in a component of its own, `src/components/Pricing/index.astro`, and import it only from the two route files:

```astro
---
import hero from './assets/hero.png';

interface Props {
  language: string;
}

const cn = Astro.props.language === 'cn';
---

<main class='pricing' data-pagefind-body>
  <h1>{cn ? '价格' : 'Pricing'}</h1>
  <img
    src={hero.src}
    width={hero.width}
    height={hero.height}
    alt={cn ? '产品截图' : 'Product screenshot'}
  />
  <a href={cn ? '/zh-CN/capabilities/' : '/capabilities/'}>
    {cn ? '查看应用能力' : 'Browse capabilities'}
  </a>
  <button type='button' class='pricing__toggle'>
    …
  </button>
</main>

<style>
  /* Scoped to this component and shipped only with the pages that import it. */
  .pricing {
    padding: 48px 24px;
  }
</style>

<script>
  // Bundled and loaded only on the pages that import this component.
  document.querySelector('.pricing__toggle')?.addEventListener('click', () => {
    // …
  });
</script>
```

- **Styles and scripts stay on this page** as long as only this page's route files import the component. Astro bundles the styles of every component a route file imports into every page that route builds, which is why each kind of page here has its own route file. Do not import page-specific components or CSS from `BaseLayout`, the header, the footer or `src/styles/global.css`; those reach every page. A larger stylesheet can be a `index.scss` next to the component, imported in its frontmatter (`import './index.scss';`), as the existing hand-built pages do.
- **Images and other assets** go in `src/components/Pricing/assets/` and are imported in the frontmatter; use `.src` for the URL. The build publishes them under `/_astro/` with a hashed name.
- **Links** to other pages use their public paths in the page's language (`/capabilities/`, `/zh-CN/capabilities/`). The build checks them like any other link.
- `data-pagefind-body` puts the page's content in the search index; leave it out if the page should not be searchable.

### 3. Wrap it in `BaseLayout`

`src/pages/pricing.astro`:

```astro
---
import Pricing from '../components/Pricing/index.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  language='en'
  route='/pricing'
  title='Pricing'
  description='What NocoBase 3 costs and what each plan includes.'
>
  <Pricing language='en' />
</BaseLayout>
```

`src/pages/zh-CN/pricing.astro` is the same with one more `../` in the imports, `language='cn'` and the Chinese `title` and `description`. `route` stays `/pricing`: it is the language-neutral route.

`BaseLayout` props:

| Prop               | Required | Meaning                                                                                                                                                                                        |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `language`         | yes      | `en` or `cn`.                                                                                                                                                                                  |
| `route`            | yes      | The language-neutral URL in its exact slash shape: `/pricing` or `/pricing/`. It builds the canonical URL and the language alternates, so it must match where the route file is.               |
| `title`            | yes      | Page title. The `<title>` becomes `Pricing - NocoBase Documentation` (`… - NocoBase 文档` in Chinese).                                                                                         |
| `fullTitle`        | no       | Use `title` as the whole `<title>`, without the site name.                                                                                                                                     |
| `description`      | no       | Meta and Open Graph description. Write one.                                                                                                                                                    |
| `keywords`         | no       | Meta keywords.                                                                                                                                                                                 |
| `translations`     | no       | Languages the page exists in; defaults to both. Pass `translations={['en']}` when there is no Chinese page, or the Chinese alternate points at a page that does not exist and the build fails. |
| `noindex`          | no       | Keep the page out of search engines and the sitemap.                                                                                                                                           |
| `header`, `footer` | no       | Default `true`. Set `false` only when the page's own markup carries a header or footer.                                                                                                        |
| `layout`           | no       | `data-layout` on `<body>`; leave it unset for a hand-written page.                                                                                                                             |
| `structuredData`   | no       | Extra JSON-LD objects for the page.                                                                                                                                                            |

The layout adds the site header and footer, `<html lang>`, the `<title>`, description, keywords, the `robots` meta, the canonical link, `hreflang` alternates for each language in `translations` plus `x-default`, and Open Graph and Twitter tags. The sitemap is generated from the emitted HTML, so the page is listed there automatically with its alternates (unless `noindex`).

### 4. Link to it

- From the header: add an `<a>` to the HTML in `src/components/SiteHeader/header.en.json` and `header.cn.json`. The home page has its own top bar in `src/components/FullHome/markup*.json`; add the link there too if it should show on the home page.
- From Markdown pages: a relative `.md` link cannot name an `.astro` page, so write its public path, `[Pricing](/pricing)` in English and `[价格](/zh-CN/pricing)` in Chinese. The build's link check still verifies it.
- The sidebar (`_meta.json`) is for Markdown pages; `scripts/normalize-doc-links.mjs` reports a sidebar link to a hand-written page as dead.

### What a hand-written page does not get

It has no `.md` copy and is not listed in `llms.txt` or `llms-full.txt`, because those are generated from Markdown sources. If it should be there, make it a hand-built page with a Markdown twin, the way the home page, the comparison and the overviews work: keep a Markdown source under `docs/<lang>/` with a `pageName` in its frontmatter, map that `pageName` to a new `PageKind` in `pageKind()` in `src/lib/pages.ts`, and add a route file under `src/pages/[...base]/` that renders `staticPathsOf('<kind>')`, using `src/pages/[...base]/nocobase-2-vs-3.astro` as the template. The twin's frontmatter then supplies the page's title, description and keywords, and its body supplies `llms.txt` and the `.md` copy. See [`.agents/rules/docs-site.md`](../.agents/rules/docs-site.md#adding-a-page).

### 5. Check it

- `pnpm --filter @nocobase/docs dev`, then open `http://localhost:4321/pricing` and `http://localhost:4321/zh-CN/pricing`. Check the header, footer and the language menu.
- `pnpm --filter @nocobase/docs build` passes (no broken links).
- `dist/pricing/index.html` and `dist/zh-CN/pricing/index.html` exist; their `<head>` has the expected `<title>`, `<link rel="canonical" href="https://docs.nocobase.com/pricing">` and both `hreflang` alternates.
- `dist/sitemap.xml` lists `https://docs.nocobase.com/pricing` and `https://docs.nocobase.com/zh-CN/pricing`.
- Other pages are unaffected: your component's class names and scripts appear only in the two pages' HTML.
- `pnpm --filter @nocobase/docs lint` and `typecheck` pass; `pnpm format` at the repository root formats the files you changed with Prettier.

## Changing the home page, the comparison, an overview, the header or the footer

These pages render hand-built markup from JSON (see [Copy of the hand-built pages](#copy-of-the-hand-built-pages)). Each also has a **Markdown twin** under `docs/<lang>/`:

| Page                 | Markdown twin                                                                             | Rendered from                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Home page            | `docs/<lang>/index.md`                                                                    | `src/components/FullHome/markup*.json`, `data*.json`              |
| NocoBase 2 vs 3      | `docs/<lang>/nocobase-2-vs-3.mdx`                                                         | `src/components/ArchitecturePitch/markup*.json`                   |
| Capability overviews | `docs/<lang>/capabilities/<module>/index.md(x)` or `docs/<lang>/capabilities/<module>.md` | `src/components/CapabilityOverview/pages*.json`, entry `<module>` |

**Editing the twin's body does not change the rendered page.** The twin only supplies the page's `<title>`, description and keywords (from its frontmatter), its `.md` copy and its entries in `llms.txt` and `llms-full.txt`. To change what readers see, edit the JSON; then update the twin so the Markdown copy says the same thing.

Steps:

1. Edit the visible text in the Chinese file (no suffix) and the English file (`.en.json`). For a capability overview, edit the module's entry (`"auth"`, `"file"`, …) in `pages.json` and `pages.en.json`; its scenario prompts are in `promptLibrary` in `src/components/FullHome/data*.json`, shared with the home page.
2. If the change affects the title, description or substance of the page, update the twin's frontmatter and body in both languages.
3. Header: edit `src/components/SiteHeader/header.cn.json` and `header.en.json`. They are used on every page except the home page, whose top bar is part of `FullHome/markup*.json`; change both when the header should stay the same everywhere.
4. Footer: edit the two lines in `src/components/SiteFooter/index.astro`. The home page and the overviews carry their footer inside their own markup JSON; change those too to keep them consistent.
5. Preview at `http://localhost:4321/` and `/zh-CN/` (home), `/nocobase-2-vs-3`, `/capabilities/<module>` (for example `/capabilities/auth/`), then build. These are layout changes, so also check them visually at 1440 px and 390 px wide.

## Previewing and checking

```bash
pnpm --filter @nocobase/docs dev         # English at http://localhost:4321/, Chinese at http://localhost:4321/zh-CN/
pnpm --filter @nocobase/docs build       # docs/dist/; fails on a broken link or heading fragment
pnpm --filter @nocobase/docs preview     # serves the built docs/dist/
pnpm --filter @nocobase/docs lint
pnpm --filter @nocobase/docs typecheck
pnpm --filter @nocobase/docs test
cd docs && ./check.sh                    # structure: file tree, _meta.json and _nav.json alignment, bloated files, deprecated references
```

`check.sh` compares every language with `cn`: the same Markdown and `_meta.json` files must exist in each. Restrict it to one language with `./check.sh --lang=en`, or check that the Chinese changes of a pull request reached English with `gh pr view <pr> --json files --jq '.files[].path' | ./check.sh --with-i18n-coverage`. [`scripts/README.md`](scripts/README.md) documents each script.

`DOCS_SITE_ORIGIN` sets the origin of canonical links, `sitemap.xml`, `robots.txt` and `llms.txt` (default `https://docs.nocobase.com`):

```bash
DOCS_SITE_ORIGIN=https://staging.example.com pnpm --filter @nocobase/docs build
```

For changes to layout, styles or the hand-built pages, compare the pages you touched before and after at 1440 px and 390 px wide. CI runs `check.sh`, lint, typecheck, test and build on every pull request that touches `docs/`.

## Publishing

Merging into `v3-develop` publishes the site. [`.github/workflows/v3-docs.yml`](../.github/workflows/v3-docs.yml) runs on every pull request and push touching `docs/`: it runs `check.sh`, lint, typecheck, test and the build. On a push to `v3-develop` it then uploads `dist/` to a new timestamped directory (`YYYYMMDDHHMMSS`, Asia/Shanghai time) in the OSS bucket, copies `dist/404.html` to the bucket root, and runs `scripts/deploy-cdn.mjs`, which points the CDN's back-to-origin rules at the new directory, refreshes the cache and deletes all but the previous version. Readers see either the old site or the new one, never a mixture.

To publish without a push, run the workflow manually (`workflow_dispatch`) with `publish` checked; without it the run only builds and checks.

To roll back, point the CDN at the previous version, which is still in the bucket: run `node scripts/deploy-cdn.mjs --timestamp <previous YYYYMMDDHHMMSS>` from `docs/` with the `DOCS_ALI_*` credentials the workflow uses. Nothing is rebuilt.

## Pitfalls

- **The Markdown twins do not render.** `docs/<lang>/index.md`, `nocobase-2-vs-3.mdx` and the capability overview sources only feed the `<title>`/description, the `.md` copy and `llms.txt`. The visible page comes from the JSON in `src/components/`. Update the twin when the visible copy changes.
- **JSON language naming.** `markup.json`, `data.json` and `pages.json` are Chinese; `markup.en.json`, `data.en.json` and `pages.en.json` are English. The header is `header.cn.json` / `header.en.json`.
- **No hand-written URLs in Markdown.** Link to `.md` files relatively; the build produces the URL. The exceptions are downloads in `public/` and hand-written `.astro` pages.
- **Do not change URL shapes or `build.format`.** Published URLs are indexed, and the CDN maps extensionless URLs to `<path>/index.html`. Renaming `x.md` to `x/index.md` changes `/x` to `/x/`.
- **Every page needs both languages**, or a hand-written page must declare `translations={['en']}`. A Markdown page missing in `cn` fails `check.sh`.
- **Sidebar groups are collapsed by default.** Set `"collapsed": true` on every group in `_meta.json`, in both languages. The group containing the current page opens automatically.
- **Styles leak through shared imports.** Anything imported by `BaseLayout`, the header or the footer reaches every page; keep page-specific CSS and scripts in that page's own component.
