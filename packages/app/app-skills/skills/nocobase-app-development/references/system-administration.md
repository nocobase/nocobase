# System administration

## Default delivery

A complete application includes System management navigation and working administration pages by default. Users asking for a CRM, an order system or another business application do not need to enumerate its administrative infrastructure. Follow explicit exclusions and narrower deliverables such as API-only services or prototypes explicitly limited to business screens. For an individual feature, integrate its administration into the existing application.

Inspect existing routes, pages, plugin registrations and plugin Skills before implementing administration. Reuse installed capabilities and existing management pages; create application-owned pages for missing interfaces. Deliver real data, actions and initial permission configuration, rather than empty menu entries or placeholder pages. Follow the normal plugin installation workflow when a required capability is missing.

## Administration baseline

| Capability            | Default outcome                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User management       | Administrators can list and manage application users, their active status and supported account lifecycle operations through the installed user and authentication capabilities. |
| Roles and permissions | Administrators can manage roles, assign users and configure the application's supported page, action and data access permissions.                                                |

For implemented workflows, background tasks and notifications, deliver status, execution or delivery records, failure reasons and supported recovery actions within their respective management pages. Reuse installed execution capabilities and add missing application-owned views. Do not invent telemetry or offer recovery actions the runtime cannot perform. Infrastructure dashboards and external observability platforms require relevant scope.

Add management pages for the capabilities the application uses: organizations and departments, business reference data, integration and notification settings, background tasks, and workflow definitions, parameters and executions. Whenever requirements include a process to develop, include its workflow management pages by default following [Lifecycle UI](lifecycle-ui.md), even if the user did not separately request a management console.

## Navigation and access

Group administrative capabilities under a consistent System management or Settings section, separate from business navigation. Reuse an existing group and follow [settings pages](frontend/references/page.md#5-settings-pages); management pages use the application's normal layout. Use the UI Library `workflow-management` block for workflow administration, following [Lifecycle UI](lifecycle-ui.md) for installation, navigation and application-owned data/permission adapters.

Place User management, Roles and permissions, Workflow management, Background tasks and other applicable capabilities directly under System management as sibling menu entries. Include capability-specific entries only when the application uses those capabilities. Do not introduce an Operational monitoring menu or an intermediate monitoring group. Workflow management is a single clickable sidebar entry whose page switches between Definitions and Executions with in-page tabs. These views retain URL-backed child routes without sidebar `navigation`; background task pages own their task status, execution history, failures and supported recovery actions. Notification management similarly owns delivery records. Follow the same structure under an existing Settings section.

Configure initial administrator access through the supported authentication and authorization mechanisms. A signed-in administrator must be able to discover and use the management section. Distinguish administrative read and update access, and keep configuration permissions separate from business operations such as approvals. Enforce access in menu visibility, direct page access and server-side operations. Ordinary users receive only explicitly granted access.

## Acceptance

Verify with a real authenticated administrator that the management entry appears, its pages load actual data, and permitted management operations succeed. Verify with an ordinary user that restricted menus, direct URLs and API operations are protected. Where read-only administration is supported, verify that reading succeeds and updates are denied.

Verify that applicable management entries are siblings directly under System management, with execution records and failures accessible inside each capability. When the application includes workflows, verify that Workflow management has one sidebar entry and that Definitions and Executions appear only as tabs within its page. For workflows, verify that implemented definitions and business executions appear in management, parameter changes respect their effective timing, and execution history and failures remain inspectable. Use the [Lifecycle UI verification guidance](lifecycle-ui.md#source-examples-and-verification) for detail navigation and presentation. Report any unverified behavior and its missing prerequisites explicitly.
