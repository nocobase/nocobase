# Route surfaces

Route surfaces keep URL navigation separate from visual presentation. The same
business content can be hosted by a routed drawer, dialog, or full page.

The Registry also installs a lazy-loaded Demo route at `/route-surfaces` with
live drawer, dialog, child-page, nested-drawer, and mixed page/drawer/dialog
scenarios plus a Prompt generator.

## Components

- `RouteDrawer` supports URL-backed nested drawers and push-style stacking.
- `RouteDialog` provides the same close contract for modal routes.
- `RoutePage` provides the close context without an overlay.
- `useRouteSurfaceClose` lets content request a close without knowing how it is
  presented.
- `useRefineUnsavedChangesGuard` adapts Refine's unsaved-change state to the
  route surface close lifecycle and renders a shadcn Alert Dialog confirmation.

Route definitions, ACL guards, resource data fetching, and application-specific
paths remain application concerns.
