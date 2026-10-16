# NocoBase Documentation

The documentation site, built with [Rspress](https://rspress.rs/). It is a workspace package (`@nocobase/docs`), so `pnpm install` at the repository root installs its dependencies along with everything else.

```bash
pnpm --filter @nocobase/docs dev
pnpm --filter @nocobase/docs build
```

## `--lang`

Each language is built as a separate site: `en` is served from `/`, Simplified Chinese (`cn`) from `/zh-CN/`, and every other language from `/<lang>/`. Chinese source files remain in `docs/cn/`, and its build output goes to `dist/zh-CN/`. The Chinese build also generates compatibility pages under `dist/cn/` that redirect old page URLs to `/zh-CN/`, preserving query strings and fragments. The language is selected by `--lang` or by the `DOCS_LANG` environment variable, defaulting to `en`.

```bash
pnpm --filter @nocobase/docs dev --lang=cn
pnpm --filter @nocobase/docs build --lang=cn
pnpm --filter @nocobase/docs preview --lang=cn
pnpm --filter @nocobase/docs build --lang=all
```

The site framework carries translations for `cn / en / ja / es / pt / de / fr / ru / id / vi`, but only the languages that have a directory under `docs/` are actually built. Today that is `cn` and `en`; adding a language is a matter of creating its directory.

## `--check-dead-links`

Dead-link checking is on by default during build and covers links in Markdown bodies. Links in frontmatter — the home page hero actions and feature cards — are not checked, so a route named there can be missing without failing the build.

```bash
pnpm --filter @nocobase/docs build --lang=en --check-dead-links=false
```

## Structural checks

`check.sh` runs the same structural checks CI does: file-tree, `_meta.json`, `_nav.json` and home-page alignment across languages, plus bloated-file and deprecated-reference detection. `cn` is the baseline every other language is compared against.

```bash
./check.sh
./check.sh --lang=es
gh pr view <pr> --json files --jq '.files[].path' | ./check.sh --with-i18n-coverage
```

`scripts/README.md` documents each script individually.

## Documentation AI assistant

The documentation assistant calls an independent Rust backend from the `docs-ai-service` repository. The backend searches and verifies live pages under `docs.nocobase.com`; the documentation build does not generate a local AI index. With `DOCS_AI_API_URL` unset the assistant renders but has nothing to call, which is the expected state for local documentation work.

```bash
cd <path-to-docs-ai-service>
cargo run

cd <path-to-nocobase3>
DOCS_AI_API_URL=http://127.0.0.1:3100 pnpm --filter @nocobase/docs dev --lang=cn
```

Configure the backend for the approved DeepSeek online search provider before starting it. The UI always displays server-provided official citations and renders answer text without raw HTML.

## Toolchain

Prettier is the repository baseline, `@nocobase/dev-config/prettier`. ESLint is this package's own flat config, with `eslint-plugin-react-hooks` covering hook dependency lists, conditionally called hooks, and missing list keys. Both should report nothing.

```bash
pnpm --filter @nocobase/docs lint
pnpm --filter @nocobase/docs format
```

`theme/components/{Nav,NavHamburger,NavScreen,Search,HomeHero}` are vendored from Rspress's ejectable theme and excluded from both tools. They are kept byte-for-byte so that a Rspress upgrade is a diff against the new upstream copy; formatting or lint-fixing them destroys that. Fix a problem in one of them upstream and re-copy. `Search/SearchPanel.tsx` and `Search/SuggestItem.tsx` do carry deliberate local changes, each with a header naming them.

The exclusion is spelled out in three places, and adding a sixth vendored directory means editing all three:

| Where                                        | Covers                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `eslint.config.mjs`, `VENDORED_FROM_RSPRESS` | ESLint, wherever it runs from                                                     |
| `.prettierignore`                            | Prettier run inside this directory                                                |
| the repository root `.prettierignore`        | Prettier run from the repository root — the pre-commit hook and `pnpm format:all` |

The pre-commit hook runs this package's own ESLint because `lint-staged.config.mjs` at the repository root lists `docs` in `SELF_LINTING_DIRECTORIES`. Without that entry it would run the root ESLint, which matches nothing here and would exit zero without checking anything.

## eject `rspress components`

Customize the theme by ejecting the components. After ejecting, you can find the components in `./theme/components` and modify them as you like.

```bash
pnpm --filter @nocobase/docs eject <ComponentName>
```

## demo preview

Use `@docs/*` to import demo components; the alias resolves to `docs/` at build time.

```tsx
import { HelloModel } from '@docs/cn/flow-engine/_demos/HelloModel';
```

Then use the demo component in the markdown file:

````markdown
```tsx file="./_demos/flow-model-renderer.tsx" preview

```
````
