# @nocobase/app-plugin-notification-example

This example demonstrates a small business workflow around task assignment and in-app notifications.

Create a task, select an application user as the assignee, and send a notification containing the task summary. The recipient can open the notification, view the task details, and update the task. Successful updates notify related people other than the current editor; when the assignee changes, both the previous and new assignees receive the follow-up notification.

The example uses the built-in `in-app` notification Channel and does not require external email or IM credentials.

## API

Every route requires a signed-in user and lives under `/api/notificationExample`:

| Method  | Path                     | Answers                                                                 |
| ------- | ------------------------ | ----------------------------------------------------------------------- |
| `GET`   | `/assignees`             | `{ data, meta: { total } }`, the active users a task may be assigned to |
| `GET`   | `/tasks?page=&pageSize=` | `{ data, meta: { page, pageSize, total } }`, pageSize ≤ 100             |
| `POST`  | `/tasks`                 | `201 { data }` from `{ title, description, assigneeId }`                |
| `GET`   | `/tasks/{taskId}`        | `{ data }`                                                              |
| `PATCH` | `/tasks/{taskId}`        | `{ data }`; send only the fields that change                            |

A task's `createdAt` and `updatedAt` are RFC 3339 UTC timestamps, such as `2026-10-04T08:30:00.000Z`.

Errors use the standard body with domain `notificationExample`. Only a task's creator and assignee may read or update it; anyone else gets `403 TASK_ACCESS_DENIED` whether or not the task exists. Reassigning by someone other than the creator is `403 TASK_ASSIGNMENT_FORBIDDEN`, and an inactive or unknown assignee is `400 ASSIGNEE_NOT_FOUND` with a field violation on `assigneeId`.

Each route declares itself for the application's API document, which a signed-in user reads at `/api/swagger/docs`. In `server/routes/index.ts`, `describeRoute()` from `@nocobase/app-server/router` gives the `NotificationExample` tag, a summary, an `operationId` (`notificationExampleListAssignees`, `notificationExampleListTasks`, `notificationExampleGetTask`, `notificationExampleCreateTask`, `notificationExampleUpdateTask`) and the responses, the reasons above included; `apiValidator()` validates the path, query and body and documents them; the task and user schemas live in `server/routes/schemas.ts` with `.meta({ ref })`.
