# Employee onboarding page design

The structure reference is the existing Examples procurement list and route drawer. Retain its native navigation, DataTable pagination, inline error feedback, drawer close guard and theme tokens. The approved interaction is a local four-step form with explicit draft saves; switching steps makes no request. There is no external visual reference or page-specific theme.

| Element        | Composition                                                                      | Acceptance                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| List           | PageContainer, PageHeader, DataTable, Input and local shadcn Select              | Search by name/email and filter status; show loading, empty and retryable read errors. New is visible only to coordinators.   |
| Wizard         | RouteDrawer, FeedbackForm, one controlled input object and a four-item step list | Next validates only the current step. Previous retains values. The first incomplete step is derived on reopen.                |
| Employment     | Department Select, Inputs and conditional employment fields                      | Full-time probation and contractor end date are required as appropriate. Department selection uses authorized candidates.     |
| Documents      | Repeatable semantic sections with Select/Input/Button                            | Each document has type, title and reference number. Missing conditional documents prevent confirmation. No upload UI.         |
| Confirmation   | Read-only semantic definition list and document list                             | Echo all entered values. Save before submit. Submitted view includes employee ID and authorized history.                      |
| Write feedback | Native submission controller, inline error and explicit reload                   | Disable both write actions through detail refresh; retain original key after uncertain results and retain input on conflicts. |

At 1440×1000 the drawer uses the host wide-drawer pattern; at 390×844 fields and confirmation values stack and footer actions remain reachable. Use semantic colors in light/dark and both density presets. English/Chinese copy comes from the page locale module. A coordinator and HR viewer have independent capabilities; draft detail remains private even to another coordinator or administrator. Use the scoped case view for history instead of registering confidential drafts in the example's unrestricted workflow inspection catalogue.
