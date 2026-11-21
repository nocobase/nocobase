# Design contract

Application UI and plugin UI embedded in an application share this contract, [`ui-guidelines.md`](ui-guidelines.md) and [the workflow](ui-workflow.md). Plugins keep their own implementation, ownership and commands.

## Design references

Before planning a page, read the user's references and the application's existing design records. A reference controls one of three things: its **appearance** (reproduce structure and visual treatment at the reference viewport), its **structure** (grouping, placement and navigation, drawn with the application's own theme and components) or its **style** (density, typography, surfaces, with structure taken from the task). Note in the page plan which one each reference controls; ask only when that changes the result materially, and never invent what an unreadable reference shows. Without a reference, follow the application's existing design and then the NocoBase defaults. A reference changes looks, never usability: keyboard and focus, reachable actions, permissions, validation and failure recovery stay.

## Where decisions live

The application keeps its reusable design decisions in its own Git-tracked documentation: the existing design record if there is one (such as `DESIGN.md`), otherwise `docs/ui/design-system.md` for system-wide decisions (terminology, navigation, tokens, repeated patterns) and `docs/ui/pages/<feature>.md` for each page plan. Never keep them under `.agents/skills/`, `node_modules` or `storage/`, which synchronization and cleanup replace. Update a decision when it changes instead of adding a second one.

## Component selection

Choose every interactive element in this order:

1. An existing business component or NocoBase composition that already does the job, such as `DataTable`, `DatePicker`, `RowActions` or a route overlay. Read its source; the name alone proves nothing. A plugin uses public exports, never private host imports.
2. An installed shadcn primitive under `client/components/ui/`, used through its own API and variants.
3. A registry addition: a primitive or block from [the `ui-library` catalog](references/ui-library.md), added with the CLI as [`references/shadcn.md`](references/shadcn.md) describes. A primitive that is not installed yet is no reason to hand-write one.
4. A custom composition of those primitives, only when they cannot provide the behavior or the user asked for it; say why in the page plan or the report.

Semantic layout HTML (`main`, `form`, `label`, links, containers) needs no replacement. Express reference colors and sizes through the [theme](references/theme.md) and component variants, not per call site.

## Component checker

Run it on the changed client source of each owning package before delivery. From an installed application root (paths after `--root` are relative to that package):

```bash
node .agents/skills/nocobase-app-development/scripts/check-ui-components.mjs --root . client/pages/customers.tsx client/components/customer-form.tsx
node .agents/skills/nocobase-app-development/scripts/check-ui-components.mjs --root packages/my-plugin client/pages/customers.tsx
```

Without file arguments it scans the package's `client/`. In a NocoBase source checkout the script is [`packages/app/app-skills/skills/nocobase-app-development/scripts/check-ui-components.mjs`](../../scripts/check-ui-components.mjs) and `--root` is the template or plugin. It reports hand-built native controls, native date inputs, actions outside `RowActions` and create or edit forms that skip the discard question. Exit code `0` means no findings, `1` findings to fix, `2` an incomplete scan (Not verified). A necessary native adapter takes a `ui-component-exception: <reason>` comment on the line before the element; never add one just to silence a finding. A clean scan does not prove reuse: review imports and wrappers too.
