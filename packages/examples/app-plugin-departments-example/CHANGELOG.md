# @nocobase/app-plugin-departments-example

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
