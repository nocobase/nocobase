# Documentation Site

Rules for editing anything under `docs/`. [README.md](README.md) is the full authoring guide with step-by-step walkthroughs; `.agents/rules/docs-site.md` at the repository root explains the architecture. Paths below are relative to this directory.

## Which Files Hold What

- **Content**: Markdown pages in `docs/<lang>/**/*.md(x)` (`en`, `cn` and `vi`), sidebars in `_meta.json`, `llms.txt` grouping in `docs/<lang>/_nav.json`, images in `docs/<lang>/capabilities/assets/`, downloads in `docs/<lang>/public/` (served at `/downloads/…` and `/zh-CN/downloads/…`).
- **Hand-built page copy**: home page `src/components/FullHome/markup*.json` and `data*.json`, the 2 vs 3 comparison `src/components/ArchitecturePitch/markup*.json` and `assets/`, the capability overviews `src/components/CapabilityOverview/pages*.json`, the header `src/components/SiteHeader/header.{cn,en}.json` (every page except the home page, which has its own top bar in its markup), the footer `src/components/SiteFooter/index.astro` (the home page and overviews carry their own footer in their markup).
- **Deployment guide**: `src/components/Deployment/content*.json` supplies the visible copy; keep the commands and anchors aligned with `docs/<lang>/deployment.md`. Its dedicated Astro route and browser script preserve tabs, section links and command copying.
- **Framework**: `astro.config.ts`, `shared/`, the rest of `src/`, `scripts/`, `tests/`, `.github/workflows/v3-docs.yml`. Change it only when the task is about the site itself, and read `.agents/rules/docs-site.md` first.

## Adding Pages

- **Markdown page**: create it at the same path in `docs/en/` and `docs/cn/`, with frontmatter (`title`, `description`, `keywords`) and one `# Heading`, and add a `{ "type": "file", "name": "<file>", "label": "…" }` entry to the directory's `_meta.json` in both languages. Nothing else needs registering. See "Adding a Markdown page" in the README.
- **Hand-written page**: create `src/pages/<path>.astro` and `src/pages/zh-CN/<path>.astro`, both wrapping a page component of its own in `BaseLayout` with `language`, `route` (language-neutral, exact slash shape: `/<path>` for `<path>.astro`, `/<path>/` for `<path>/index.astro`), `title` and `description`. Keep its styles, scripts and assets in that component (`src/components/<Name>/`) and import it only from those two route files. Such a page has no `.md` copy and is not in `llms.txt`; it needs a Markdown twin and a `PageKind` in `src/lib/pages.ts` for that. See "Adding a hand-written page" in the README.

## Pitfalls

- The Markdown twins of hand-built pages (`docs/<lang>/index.md`, `nocobase-2-vs-3.mdx`, the capability overview sources such as `capabilities/auth/index.mdx` and `capabilities/file.md`) are not rendered. Their frontmatter feeds the page's `<title>`, description and keywords, and their body feeds the `.md` copy and `llms.txt`. Change visible copy in the JSON, then update the twin to match.
- In the hand-built pages' JSON, the file without a suffix (`markup.json`, `data.json`, `pages.json`) is Chinese, `.en.json` is English and `.vi.json` is Vietnamese. The header names them `header.cn.json`, `header.en.json`, `header.vi.json`. Edit every language.
- Never hand-write public URLs in Markdown for other documentation pages; link to the source file relatively (`../auth/index.md`, `./api-keys.md#create`). Only downloads in `public/` and hand-written `.astro` pages are linked by public path.
- Never change URL shapes, `build.format` or file names of published pages: published URLs are indexed and the CDN maps extensionless URLs to `<path>/index.html`.
- Every page exists in both languages; `cn` is the baseline `check.sh` compares against. A hand-written page with only one language passes `translations={['en']}` to `BaseLayout`.
- Do not import page-specific components or CSS from `BaseLayout`, the header, the footer or `src/styles/global.css`; they reach every page.

## Sidebar Groups

Sidebar groups must be collapsed by default to keep navigation compact. Set `"collapsed": true` on every collapsible group in `_meta.json`, including nested directory groups, and apply the same setting across all language versions. Follow this convention when adding or updating sidebar groups.

A group that contains the current page always renders expanded, and a group a reader opens or closes stays that way for the rest of the visit, so readers can locate the page in the sidebar.

## Capability Module Navigation

Capability modules listed as directories in `docs/<lang>/capabilities/_meta.json` use their own `_meta.json` as the sidebar root. Maintain each module's order and nested groups there; do not duplicate its menu in the site code. `src/lib/sidebar.ts` builds the module sidebar with a localized link back to the capabilities overview. Module overview pages are hand-built and have no sidebar, while their documentation subpages retain it.

## Checks

Run `pnpm --filter @nocobase/docs build` (fails on broken links and heading fragments), `lint`, `typecheck` and `test`, and `./check.sh < /dev/null` in this directory (without a terminal on stdin, `check.sh` waits for a changed-file list on stdin). For changes to layout, styles or the hand-built pages, also compare the touched pages visually at 1440 and 390 px wide.

For everything else about the site — layouts, SEO and llms outputs, deployment — read `.agents/rules/docs-site.md` at the repository root.
