# NocoBase Documentation

The documentation site, built with [Astro](https://astro.build/). It is a workspace package (`@nocobase/docs`), so `pnpm install` at the repository root installs its dependencies along with everything else.

```bash
pnpm --filter @nocobase/docs dev       # http://localhost:4321/ and /zh-CN/
pnpm --filter @nocobase/docs build     # docs/dist/
pnpm --filter @nocobase/docs preview   # serve docs/dist/
```

One build writes every language: English (`docs/en/`) to `dist/`, Simplified Chinese (`docs/cn/`) to `dist/zh-CN/`. Every page is emitted as `<path>/index.html`, the layout the CDN serves extensionless URLs from.

`DOCS_SITE_ORIGIN` sets the origin used in canonical links, `sitemap.xml`, `robots.txt` and `llms.txt` (default `https://docs.nocobase.com`):

```bash
DOCS_SITE_ORIGIN=https://staging.example.com pnpm --filter @nocobase/docs build
```

## Checks

```bash
pnpm --filter @nocobase/docs lint
pnpm --filter @nocobase/docs typecheck
pnpm --filter @nocobase/docs test
cd docs && ./check.sh
```

The build fails on a broken internal link or heading fragment. `check.sh` runs the structural checks CI runs: file-tree, `_meta.json` and `_nav.json` alignment across languages, bloated-file and deprecated-reference detection. `cn` is the baseline every other language is compared against.

```bash
./check.sh --lang=en
gh pr view <pr> --json files --jq '.files[].path' | ./check.sh --with-i18n-coverage
```

`scripts/README.md` documents each script. How the site is put together, how to add a page and what it publishes for search engines and LLMs are in `.agents/rules/docs-site.md` at the repository root.
