---
name: nocobase-app-plugin-skills-example
description: Use the Skills Example plugin to add its App Notice component, read its authenticated default Notice API, or consume its Server ServiceToken in a NocoBase App.
metadata:
  short-description: Integrate the Skills Example App Notice
---

# Skills Example App Plugin

Use this Skill when the user wants to add the plugin-provided App Notice to an
application page, read its default Notice over HTTP, or consume the same Notice
through a Server ServiceToken. Do not use it to modify this plugin's source.

## Public surfaces

- Client component: `AppNotice` and `AppNoticeProps` from
  `@nocobase/app-plugin-skills-example/client/components/app-notice`.
- Server contract: `appNoticeServiceToken`, `AppNoticeService`, and
  `AppNoticeData` from `@nocobase/app-plugin-skills-example/server/tokens`.
- HTTP API: `GET /api/skillsExample/notice`, answering `{ data: { title, description, tone } }`. The application's API document at `/api/swagger/docs` lists it as `skillsExampleGetNotice`.

The API requires an authenticated application session. It intentionally has no
additional business authorization check because the fixed example Notice is
non-sensitive. Reassess that decision before changing the response to include
private or user-specific data.

## Add the Notice to an App page

1. Confirm the plugin is registered and `plugin inspect skills-example --json`
   reports consistent Server and Skill state.
2. Import `AppNotice` from its public component export in an App-owned page or
   component.
3. Either pass App-owned typed content directly or use the App's authenticated
   client to request `GET /api/skillsExample/notice`.
4. Render the returned `data.title`, `data.description`, and `data.tone` through `AppNotice`.
5. Add an App behavior test, then run the App typecheck and build.

Do not create a Client plugin registration just to import this component. The
package provides a reusable component export, but no Client runtime
contribution.

## Consume the Server contract

Import `appNoticeServiceToken` from the public Server Token export and resolve
it from the shared application container. Do not construct the default Service
implementation or recreate a Token with the same name.

## Ownership and constraints

- The plugin owns the component, Token, Service, Route, and fixed default data.
- The App owns page placement, loading and error UI, and any App-specific
  content passed through component props.
- Import only the documented package exports; do not use plugin source paths or
  private implementation classes.
- The plugin does not persist Notices and does not provide a Settings page.
- The source Skill under the plugin's `skills/` directory is authoritative.
  The App copy under `.agents/skills/` is synchronized output and must not be
  edited directly.

## Verification

- An anonymous API request returns `401`.
- An authenticated API request returns the Notice payload with `title`,
  `description`, and `tone`.
- The target App renders the visible Notice through the public component.
- `plugin inspect skills-example --json` reports `consistent: true` with no
  issues.
- The target App passes its relevant tests, typecheck, and build.
