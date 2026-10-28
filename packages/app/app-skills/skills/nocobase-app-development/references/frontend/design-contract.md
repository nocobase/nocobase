# Shared UI design contract

Use this contract for NocoBase 3 application UI and plugin UI embedded in an application. It governs design intent and review, not package ownership or runtime APIs. The application and plugin development Skills keep their own implementation instructions; both use this contract, [UI guidelines](ui-guidelines.md), the [workflow](ui-workflow.md) and its review templates. Do not install another design Skill or copy this guidance into each plugin to use it.

## Read the product's decisions first

Read the user's reference and existing design documentation before selecting a page template or composing components. Reuse the project's established documentation locations. If none exist, use these application-owned, Git-tracked paths, creating only the files the task needs:

| File                         | Owns                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `docs/ui/design-system.md`   | System-wide design direction, business terminology, navigation, tokens and repeated interaction patterns |
| `docs/ui/pages/<feature>.md` | Page-specific requirements, reference mapping, approved departures and durable acceptance criteria       |
| `docs/ui/references/`        | Reference assets the project keeps, with their source and intended use                                   |
| `docs/ui/decisions.md`       | Decisions whose reasons are not apparent from the implementation; omit it when the page record is enough |

Use [the system template](templates/system-design.md) when establishing a system, and the reference and exception sections of [the page design template](templates/design.md) for a page. A copy edit needs no new design dossier. If a repository already has `DESIGN.md` or another design record, extend it rather than introduce a competing source of truth.

These records belong to the application, not `.agents/skills/`, `.claude/skills/`, `node_modules` or temporary `storage/`. Skills synchronization and package upgrades may replace package-owned guidance; they must not overwrite the application's design decisions. Update the durable record when an agreed decision changes. Do not preserve a duplicate description of every component or the entire conversation.

## Decide what the reference means

For each image, prototype, existing page or written specification, record its path or URL, the relevant version or screen, and one mode:

- **Faithful reproduction**: preserve the specified structure, hierarchy, visual treatment and interactions at the reference viewport. Record which details must match and how the design adapts at other sizes; this does not mean fixed pixels at every viewport.
- **Structure reference**: preserve information grouping, placement, navigation and interaction containers; use the host's theme and primitives for visual treatment.
- **Style reference**: preserve the selected visual qualities, such as density, typography and surface treatment; derive page structure from the business task.

Use the user's wording and existing approvals to select the mode. When it remains unclear and changes the outcome materially, ask one focused question and continue independent work. Do not silently label an unreadable reference "style only", invent missing details or claim a visual comparison without seeing the reference. Record inaccessible material as an open question or "Not verified". If no reference was provided, use the existing system design and then NocoBase defaults; do not require one.

Give the must-preserve details stable IDs (`V1`, `V2`, …) and map each to a component or layout decision and a `D` acceptance criterion. Record the comparison viewport, states and allowed differences. An image cannot specify permissions, saving, keyboard behavior or failure handling by itself: design those explicitly.

## Resolve precedence without losing usability

For visual and interaction choices, apply the most specific authorized decision:

1. The user's explicit requirements and subsequent corrections.
2. The confirmed feature design and its explicit page-level exceptions.
3. The application's global design contract, including the host's contract for embedded plugin UI.
4. NocoBase's default UI patterns, then upstream component examples.

An unexplained difference between two confirmed records is a conflict, not permission to pick the convenient one. Resolve it in the design and update the affected record. Do not treat a newly supplied mood image as automatically replacing an established product contract. Existing instructions to complete the work without another confirmation still apply: record the chosen interpretation and report material differences instead of adding a new approval gate.

The guideline labels express two different kinds of requirements:

| Kind                                                | Examples                                                                                                                                                                                                                        | Handling                                                                                                                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product defaults                                    | Font and spacing scales (F2–F4), page composition and action placement (L1, L2, L5), page templates (T), overlay geometry (I1)                                                                                                  | Apply by default. An explicit user requirement or confirmed design may replace the visual choice, even when its default is labelled Must; record the exact rule, replacement, scope and acceptance evidence. A Should departure needs a reason. |
| Usability, correctness and integration requirements | Keyboard and focus behavior, reachable actions, readable text, server permission checks, validation and failure recovery, protection from duplicate writes, accurate data, host theme integration and public package boundaries | Preserve the outcome. A screenshot or a visual exception is not permission to remove it. Change the implementation if needed; when requirements conflict, explain the conflict and propose an accessible, working equivalent.                   |

A rule can contain both: changing a detail view from a drawer to a page does not waive returning to the originating view; changing footer alignment does not waive keyboard order or keeping the buttons reachable. Express reference colors and sizes through the existing theme and component mechanisms rather than overriding every call site or changing unrelated host globals. An aesthetic exception is not a new runtime API, feature flag or reason to rewrite the shell.

Record a departure as: guideline ID, old default, replacement, affected pages/components, reason, authorization (user instruction or confirmed design), and acceptance criterion. Proposed exceptions remain visible as unresolved until decided; a reviewer evaluates an authorized exception against its replacement, not against the old default. An unrecorded deviation is still an issue.

## Design the system, not isolated screens

When the task spans modules, establish only the business context needed for the change:

- Identify the roles, their tasks, the record lifecycle and which actions and data each role can access. Keep names and status labels consistent across modules.
- Trace the changed journey across modules, such as lead → customer → opportunity: entry points, context carried in links, return paths, overlays, and which views refresh after a write.
- Choose the information structure before the component. Lists, details and forms can use T1–T5; boards, calendars or specialized workflows need an explicit structure, not a forced table layout.
- Cover the states the journey can reach: no data, no matches, loading, expired session, denied action, missing record, failed write and concurrent changes where relevant.

A small page change reads existing decisions and updates only what it changes. Do not require a system redesign or test unrelated modules for every task.

## From design to shadcn components

Inspect the installed component source and `components.json` before relying on widths, spacing, responsive order, close behavior or footer layout. Keep the version-matched [shadcn integration guide](references/shadcn.md) as the implementation entry. Map reference colors, type, density and radius into the existing [theme](references/theme.md); use existing component variants and composition before introducing custom components. For plugin-owned code, use the plugin Skill's component ownership, generation, theme and testing instructions instead of the application's import paths or commands.

When establishing or changing a system-wide theme or component pattern, use an existing component showcase or a scoped development fixture to show the affected variants and states together: normal, focus, disabled, pending, error and long content, in supported light/dark themes. Add one realistic composition, such as a customer form in its actual overlay. Keep contrast checks next to the foreground/background pair. Do not generate a new showcase application or install every primitive for a small change.

For overlays, follow [the installed footer and scrolling contract](references/overlay.md#6-plain-dialogs-sizes-and-scrolling). Inspect both the primitive and its wrapper; a wrapper's `footer` slot may already supply layout. A component name alone does not establish its geometry.

## Review and keep the decisions

Provide the reviewer with the original references, reference modes, durable system/page records, authorized exceptions, design, screenshots and changed files. The review has three independent questions: does it follow the reference and confirmed design, is it usable and correct, and does it follow defaults where no exception exists? Use [the acceptance checks](ui-acceptance.md), scaled to the changed behavior. Missing reference access or browser evidence is "Not verified", never a pass inferred from compiling code.

Before deleting temporary workflow records, transfer confirmed reference mappings, exceptions and reusable decisions to the application-owned records. Keep outstanding questions visibly unresolved. Preserve original user references and existing design files. Remove temporary authentication state as the workflow requires; screenshots alone are not a durable record of why a design was chosen.

The integration sources and update boundaries are documented in [sources and maintenance](design-sources.md).
