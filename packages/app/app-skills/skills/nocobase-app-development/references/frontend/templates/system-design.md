# [Application name] UI contract

Keep this in the application's existing design documentation, or `docs/ui/design-system.md` when no location exists. Record decisions that future work must preserve; omit irrelevant sections and reuse existing business specifications instead of copying them here. This file is application-owned and survives Skill synchronization and task cleanup.

## Users and journeys

- Roles and their main tasks:
- Business terminology and record states (or link to the existing specification):
- Navigation and cross-module journeys, including return context:

## Design references

| ID  | Source and version/screen | Mode: faithful / structure / style | Required qualities | Allowed differences |
| --- | ------------------------- | ---------------------------------- | ------------------ | ------------------- |
| V1  |                           |                                    |                    |                     |

## Shared decisions

- Theme, typography, spacing and density; link to the actual token definitions:
- Repeated page, form, table and overlay patterns:
- Action placement and responsive behavior:
- States, terminology and accessibility requirements:
- Plugin integration: host-owned theme/shell and permitted extension points:

## Page-specific decisions

Link to `docs/ui/pages/<feature>.md` (or the existing equivalent). A page record holds only its differences, reference mapping, authorization and acceptance criteria. It does not duplicate this global contract.

| Page | Decision record | Scope of override |
| ---- | --------------- | ----------------- |
|      |                 |                   |

## Decisions and open questions

| Decision | Reason | User instruction or confirmation | Affected pages/components |
| -------- | ------ | -------------------------------- | ------------------------- |
|          |        |                                  |                           |

Keep unresolved choices separate from confirmed decisions. Use `docs/ui/decisions.md` only when a separate record is useful. Update superseded decisions instead of leaving conflicting instructions active.
