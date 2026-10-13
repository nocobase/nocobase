# Documentation Site

Read this before changing anything under `docs/`.

## Documentation Site

`docs/` is a Rspress site copied from the v2 repository so that its custom theme, plugins, and checking scripts stay comparable with what they were ported from. It is a workspace member (`pnpm --filter @nocobase/docs <script>`), but it deliberately does not follow the shared-configuration rules the packages under `packages/` follow.

### Vendored theme components are excluded from both tools

`theme/components/{Nav,NavHamburger,NavScreen,Search,HomeHero}` are copied from Rspress's ejectable theme and kept byte-for-byte. Diffing them against the new upstream copy is the whole of a Rspress upgrade, which only works while they are unmodified.

Both tools skip them: for ESLint through `VENDORED_FROM_RSPRESS` in `docs/eslint.config.mjs`, which feeds the config's `ignores`, and for Prettier through **two** ignore files. The same five paths appear in `docs/.prettierignore`, which applies when Prettier runs inside the directory, and in the root `.prettierignore`, which applies when it runs from the repository root — the pre-commit hook and `pnpm format:all` both do. Miss either one and the files get reformatted by whichever entry point was left uncovered.

Formatting them would rewrite every one on the first run; linting them reports on code this repository does not own, where the only actionable response is the edit that destroys the diff. Fix a real problem in one of these files by fixing it upstream and re-copying, not by patching the copy. Everything outside those five directories is this repository's own code, is formatted and linted normally, and is held to zero errors.

When a copied file needs a deliberate local change, keep it and give it a header naming exactly what was changed and why — `Search/SearchPanel.tsx` and `Search/SuggestItem.tsx` are the two that carry one today. The directory stays excluded either way; the header is what tells the next person which differences are intentional.

### Formatting and linting for everything else

Prettier is the repository baseline, `@nocobase/dev-config/prettier`, referenced from `package.json` the same way every other package references it. Nothing about this directory is special to Prettier beyond the five vendored paths described above.

ESLint is this package's own flat config rather than a `dev-config` factory, because what it lints is a Rspress theme and a set of Node build scripts, neither of which the factories are shaped for. The root `eslint.config.js` enumerates the package roots it applies to and matches nothing here, so running ESLint over a file in this directory _from the repository root_ exits zero without evaluating a single rule — it looks like a pass and checks nothing. Two things follow. `pnpm lint` at the repository root is fine, because it runs each package's own `lint` script rather than one ESLint over everything. And `lint-staged.config.mjs` lists this directory in `SELF_LINTING_DIRECTORIES`, which is what makes the pre-commit hook run its ESLint from inside it; a new self-linting directory has to be added there or its rules silently stop running at commit time. The directory also pins ESLint 9 while the root is on 10, so the binary has to come from its own `node_modules` regardless.

The upstream copy of this site also carried Biome. It was dropped: its formatter duplicated Prettier over the same files with different settings, and the lint rules that were earning their place — hook dependency lists, conditionally called hooks, missing keys in rendered lists — are now covered by `eslint-plugin-react-hooks`. Removing it was a simplification only because that plugin came in with it.

### Dependencies

pnpm resolves strictly, so a dependency has to be declared even when the upstream copy relied on the flat `node_modules` a Yarn install produced. `clsx`, `body-scroll-lock`, and `js-yaml` are all imported by code that never declared them and are listed in this package as a result. When a copied file fails to resolve an import that works upstream, the cause is usually this and the fix is a declaration, not a change to the file.

React is the other divergence. The upstream copy pins React 18 through a `resolutions` field, which pnpm does not read at all, and Rspress 2.x depends on React 19 itself. This package uses React 19 and does not carry the pin; translating it would mean a root `pnpm.overrides` entry, which applies repository-wide and would drag every other package down to 18.

### Content and languages

Only the framework was copied — `docs/docs/` holds the pages this repository writes for itself. The framework carries translations for ten languages (`cn en ja es pt de fr ru id vi`) in `rspress.config.ts` and `theme/locales.ts`, but a language is only built if it has a directory under `docs/docs/`. Today that is `cn` and `en`. The `cn` source key maps to the public base `/zh-CN/` and output `dist/zh-CN/` through `docs/shared/languages.ts`; keep source paths and translation keys as `cn`. The Chinese build emits legacy `/cn/` redirect pages for static hosting. Adding a language means creating the directory; the translations are already there.

`cn` is the baseline the structural checks in `check.sh` compare every other language against, so a page added to another language without its `cn` counterpart fails the tree and meta alignment checks.

Dead-link checking runs during build, but only over links in Markdown bodies. The home page's hero actions and feature cards live in frontmatter, so a route named there can be missing without failing the build — those need checking by hand.
