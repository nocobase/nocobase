# Procurement page design

The existing Examples list and route drawer are the structure reference. Preserve the host theme, native sidebar, standard DataTable pagination and persistent list beneath the drawer. No external image reference or page-specific theme is used.

| Requirement              | Source composition                                                                                | Acceptance                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Request list and filters | `DataTable`, `PageContainer`, `PageHeader`, `Input`, Base UI `Select` through local shadcn copies | Search and state filtering preserve a reachable list; loading, empty and failed reads are visible.   |
| Draft and review         | `RouteDrawer`, `FeedbackForm`, `Input`, `Label`, `Button`                                         | Fields stack at mobile width; footer actions remain reachable. Unsaved changes require save/discard. |
| Reference choice         | Search Input plus local shadcn Select and explicit availability Select                            | Keyboard-selectable, scoped candidates; selected saved labels remain readable.                       |
| Lines and money          | Repeated semantic sections, numeric text fields and output                                        | Add/edit/remove updates the exact preview; invalid precision/quantity disables save.                 |
| Decisions and history    | Native lifecycle transitions rendered within the request drawer                                   | Only permitted buttons show; history survives reopening.                                             |

No new primitive is authored. All interactive primitives come from `client/components/ui/`; the local route components wrap the installed Base UI Dialog. The existing business table uses TanStack Table. Request/reviewer identity, state and capability determine both rendered actions and server authorization. Target viewports are 1440×1000 and 390×844. Use real synthetic-data screenshots for draft editing, submitted review, approved history and mobile layout.
