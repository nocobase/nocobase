# @nocobase/app-plugin-departments-example

## 0.0.2-beta.2

### Patch Changes

- e77641b: Point plugin guidance at `@nocobase/jobs` for background work, and at the rebuilt `@nocobase/queue` only for what jobs cannot do

  The Scheduler Skill now hands a target's lengthy work to a `JobExecutor` owned by the target's Provider, with the occurrence's own execution record as the reference, so a repeated start of the same occurrence returns the same reference; the job decides and reports its terminal outcome itself, because it cannot tell which executor attempt is the last. Recurring work without administrator visibility goes to a `ScheduleExecutor`, and only a one-time delay goes to a queue. Its description of Scheduler's own backend now names the jobs service and `scheduler.jobs` instead of the removed `queue.queues.schedule` connection. The Notification Skill's diagnostics check the jobs configuration Deliveries run on instead of a queue manager.

  The plugins' `AGENTS.md` list `@nocobase/queue` as a host-owned contract rather than a job registry. The jobs README states that background work goes there by default, the i18n Skill speaks of background jobs rather than queue jobs, and the departments example no longer composes the removed `QueueProvider` in its tests.

- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [e77641b]
- Updated dependencies [e77641b]
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/app-client@1.0.0-beta.24
  - @nocobase/app-server@1.0.0-beta.32
  - @nocobase/app-plugin-authorization@0.2.0-beta.22
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.10
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/authorization@0.1.0-beta.10
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.2-beta.1

### Patch Changes

- 41f478f: Cite `lucide-react` instead of `sonner` as the example client peer in the plugin `AGENTS.md`, since plugins report toasts through the application and no longer depend on `sonner`.
- Updated dependencies [41f478f]
- Updated dependencies [db16945]
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.8
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 0.0.2-beta.0

### Patch Changes

- 2f97f00: Add a departments example on top of the authorization example's sales and delivery domain. It adds a department tree with memberships, a primary department, a head and a region, registered with authorization as the inherited `org.department` subject type, plus a fixed `org.departmentHead` subject held by every head of an active department. Settings → Departments manages the tree, members, heads and regions, and is fully localized in English and Chinese. Two department data scopes, `org.myDepartments` and `org.myDepartmentsAndBelow`, select projects and quotes by their owner's department, and orders through their project's owner. Membership and region changes keep the authorization example's sales-member regions in sync, so the organisation feeds its "own region" data scope. The seed adds an example company, demo accounts sharing the password `departments-demo`, permission sets and rules assigned to departments, people and heads, a sharing rule that shares two specific projects with Delivery, and a few `dept-` projects, quotes and an order in the authorization example's tables. It requires `@nocobase/app-plugin-authorization-example`, registered before it, and runs with the authorization plugin alone: the seed skips sharing-rule and restriction-rule rows when those optional plugins are not installed. Reset the example database to get the seeded data.
- Updated dependencies [a4ee8aa]
- Updated dependencies [2f97f00]
- Updated dependencies [2f97f00]
- Updated dependencies [2f97f00]
- Updated dependencies [2f97f00]
  - @nocobase/app-server@1.0.0-beta.28
  - @nocobase/app-plugin-authorization-example@0.1.0-beta.7
  - @nocobase/authorization@0.1.0-beta.10
  - @nocobase/app-plugin-authorization@0.2.0-beta.21
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 0.0.1

### Patch Changes

- Add the initial plugin scaffold.
