# Endpoints and types

Part of the [projects worked example](../example.md).

Rules: ["Calling an endpoint"](../api.md#calling-an-endpoint) and ["Error handling" in `api.md`](../api.md#error-handling).

The example assumes the backend provides these endpoints:

| Method and path            | Description                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/projects`        | Parameters `search` and `status` (optional); returns `{ data: Project[] }`                                                      |
| `GET /api/projects/:id`    | Returns `{ data: Project }`; 404 if it does not exist                                                                           |
| `POST /api/projects`       | Request body `{ name, owner, status }`; returns `{ data: Project }`; 409 with `code: 'PROJECT_NAME_TAKEN'` for a duplicate name |
| `PATCH /api/projects/:id`  | Changes only the fields sent; returns `{ data: Project }`; 404 if it does not exist                                             |
| `DELETE /api/projects/:id` | 204 on success; 404 if it does not exist                                                                                        |

The frontend types live in the page folder, in `client/pages/projects/types.ts`, together with the two context types the overlays read from the view behind them ([section 2.2 of `overlay.md`](../overlay.md#22-place-the-outlet-in-the-parent-page)):

```ts
// client/pages/projects/types.ts
export const PROJECT_STATUSES = ['planning', 'active', 'done'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  readonly id: number;
  readonly name: string;
  readonly owner: string | null;
  readonly status: ProjectStatus;
  readonly updatedAt: string;
}

/**
 * What the create dialog and the detail drawer read through `<Outlet context>` from the page they open over: the
 * list, or another page that opens the drawer over itself.
 */
export interface ProjectsOutletContext {
  /** Refreshes the page's data in the background. */
  readonly reload: () => void;
  /** Called after the detail drawer deletes the record: refreshes, then moves focus to a stable place (guideline A6). */
  readonly afterDelete: () => void;
}

/** What the edit dialog reads through `<Outlet context>` from the view behind it: the detail drawer, or the list for a row's menu. */
export interface ProjectEditOutletContext {
  /** Called after a successful save with the record the endpoint returned: the drawer shows it at once, and the list refreshes (guideline R2). */
  readonly onSaved: (project: Project) => void;
  /** Called on finding that the record no longer exists: the drawer switches to "not found", and the list refreshes (guideline R3). */
  readonly onNotFound: () => void;
}
```
