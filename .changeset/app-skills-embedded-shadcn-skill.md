---
'@nocobase/app-skills': patch
---

The application development Skill embeds the shadcn/ui skill from shadcn 4.21.0, unchanged, under `references/frontend/shadcn/`. `references/frontend/references/shadcn.md` says which of its files to read and where an application departs from it: run `pnpm exec shadcn`, never `apply` or `--preset`, keep create, edit and detail views as child routes, and put labels above inputs. The topic references link to the skill instead of restating its rules.

Primitives are added when a page first needs them, with `yes n | pnpm exec shadcn add <names>`: the CLI asks before overwriting an installed primitive, and an unanswered question ends a non-interactive run before the remaining files. The created files are then formatted with Prettier, and the English a few primitives carry is translated, through a prop where the primitive takes one and otherwise by replacing that literal with a key; `shadcn.md` lists each case. Each document of the worked example names the primitives its file needs on an **Add first** line.

The frontend handbook no longer points at `client/pages/reference/`, which the templates no longer ship.
