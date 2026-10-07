---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-skills': patch
---

Merge class names with the `cn` package, as shadcn's registry primitives now do, instead of a `clsx` and `tailwind-merge` wrapper. Every primitive, component and page imports `cn` from `'cn'`, `client/lib/utils.ts` is the one line `shadcn init` writes, `export { cn } from 'cn'`, and the templates no longer declare `clsx` or `tailwind-merge`. Adding a primitive with `shadcn add` therefore leaves one `cn` implementation in the application rather than two.

An existing application keeps working without changes: its own `lib/utils.ts` and every `@/lib/utils` import stay valid. To follow the templates, replace `client/lib/utils.ts` with `export { cn } from 'cn';`, change `import { cn } from '@/lib/utils'` to `import { cn } from 'cn'`, and remove `clsx` and `tailwind-merge` from `devDependencies` once nothing imports them. The frontend references now tell agents to import `cn` from `'cn'`.
