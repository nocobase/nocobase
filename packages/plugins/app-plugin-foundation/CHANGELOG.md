# @nocobase/app-plugin-foundation

## 0.1.0-beta.18

### Patch Changes

- 368299b: Open the first matching feature detail by default in the desktop Features and extensions catalog.

## 0.1.0-beta.17

### Patch Changes

- c522d01: Present Features and extensions in System settings with consistent capability details showing their purpose, current configuration and management entries, and expandable Agent requests for adding or improving features. Combine language capabilities into one entry and distinguish personal and application API key management interfaces.
- c522d01: Add a capability guide at `/capabilities` listing the application's core modules and dependent plugins, including examples. Browse a numbered catalog with type and keyword filters, then open consistent details explaining each capability's purpose, current configuration, and how to add or improve it with an Agent. The home page links to the same catalog, while the protected runtime foundation page retains its URL and access.
- c522d01: Add a concurrency configuration overview with explicit unavailable runtime values and focused Agent guidance for shared coordination, independent services and default service selection. Clarify that concurrency control does not replace idempotency.
- c522d01: Clarify the Database Explorer interface and its application-wide access permission. Provide focused Agent guidance for adding the read-only browser and configuring access without implying per-connection or field-level restrictions.
- c522d01: Show complete package names in the core and plugin catalog, allow long identifiers to wrap on narrow screens, simplify Chinese module names, and describe Foundation as a catalog of capabilities and usage guidance.
- c522d01: Present concurrency as one plugin capability, include its core module in developer references, and support searching by covered core package names.
- c522d01: Give expandable configuration actions a stable accessible name matching their visible title.
- c522d01: Organize remaining feature and example details around application configuration, interface availability, and specific Agent actions, keeping unavailable configuration evidence explicit.
- c522d01: Provide the feature configuration detail pages directly from the Foundation plugin so applications can reuse them without template-owned pages or locale resources. Discover application routes and permissions through public runtime APIs and remove duplicate template implementations.
- c522d01: Present the capability catalog as Features and extensions in System settings, replacing the App usage entry while preserving the protected runtime page. Use the header breadcrumb to return from an entry without losing catalog filters.
- c522d01: Resolve internal component aliases from source in workspace consumers so application typechecks do not require a prior plugin build; keep published aliases targeting compiled output.
- Updated dependencies [7508a76]
- Updated dependencies [fb4659d]
- Updated dependencies [6fbf389]
- Updated dependencies [1cda4c3]
- Updated dependencies [7d970d6]
- Updated dependencies [bb1dff2]
- Updated dependencies [a2a6385]
  - @nocobase/app-plugin-authentication@2.0.0-beta.20
  - @nocobase/app-server@5.0.0-beta.2
  - @nocobase/app-plugin-authorization@1.0.0-beta.37
  - @nocobase/db@1.0.0-beta.26
  - @nocobase/jobs@1.0.0-beta.6
  - @nocobase/i18n@2.0.0-beta.2
  - @nocobase/app-client@4.0.0-beta.9

## 0.1.0-beta.16

### Patch Changes

- 1d28bde: Lay out the App foundation page for scanning: capabilities wrap in a responsive grid (a single list on phones) with a status badge on every tile, selection shown by its own border and marker, readable extension names with the full package identifier kept, and key numbers grouped by capability.
- Updated dependencies [7c25f88]
- Updated dependencies [7c25f88]
- Updated dependencies [7c25f88]
- Updated dependencies [215795d]
  - @nocobase/app-client@4.0.0-beta.9
  - @nocobase/app-cli@1.0.0-beta.32
  - @nocobase/app-plugin-authentication@2.0.0-beta.19

## 0.1.0-beta.15

### Patch Changes

- 03d8ce5: Show App foundation statistics as a plain name followed by its value, without Chinese measure words, and use sentence-case metric labels in the other languages.

## 0.1.0-beta.14

### Patch Changes

- 9998ac4: Organize application administration as one System settings sidebar entry that opens a home page of cards grouped by category, with URL-backed tabs inside a module. Route navigation accepts an optional `description` that the settings home shows on each card, and App Foundation declares one. Existing settings URLs, route ids and authorization stay unchanged; updating dependencies alone keeps an existing application's navigation, so reconcile the application-owned navigation transform, routing, settings pages and locales with the `nocobase-app-upgrade` Skill's System settings navigation guide.
- Updated dependencies [78bdca8]
- Updated dependencies [9998ac4]
- Updated dependencies [87f1ea5]
- Updated dependencies [6507d01]
  - @nocobase/app-plugin-authentication@2.0.0-beta.19
  - @nocobase/app-plugin-authorization@1.0.0-beta.36
  - @nocobase/app-client@4.0.0-beta.8
  - @nocobase/app-server@5.0.0-beta.1
  - @nocobase/app-cli@1.0.0-beta.32

## 0.1.0-beta.13

### Minor Changes

- 99de914: Persist App Foundation snapshots and refresh them through background Jobs on first use, manual refresh or a changed running kernel version. Retain historical results and independent record-count timestamps across restarts, and show compact statistics with explicit pending and partial states. Replace GET refresh/count flags with protected POST actions and active-scan status polling.

### Patch Changes

- be17408: Preserve database model associations through proven local callbacks and query accessors, and reject malformed request header names.
- cf23bfe: **Breaking:** Remove the deprecated `@nocobase/app-server/mailer` entry and its `Mailer`, `mailerToken`, `createMailer`, `MailerProvider`, and notification configuration exports. Replace `MailExecutions.close(waitMs)` and `drain()` with `stop()` and `wait()`; transport `close()` now cancels supported network work and waits for its original completion without a nested timeout. Application owners must apply the outer shutdown budget. Create exclusive senders with `@nocobase/app-server/mailers` and declare notification config with `@nocobase/app-plugin-notification-providers/config`. Existing inline SMTP/Resend YAML, environment mappings, and provider/channel APIs remain supported.

  Default and Examples now show `mailers.default: system` and explicitly map `MAILERS_SYSTEM_*`; the example configuration remains empty at runtime. The previous `MAILERS_TRANSACTIONAL_*` sample prefix was not published. Applications may still choose any valid mailer name and custom environment prefix.

- Updated dependencies [6cc8acf]
- Updated dependencies [9933a9a]
- Updated dependencies [1e018f1]
- Updated dependencies [cf23bfe]
- Updated dependencies [4411984]
  - @nocobase/app-client@4.0.0-beta.7
  - @nocobase/app-plugin-authentication@2.0.0-beta.18
  - @nocobase/db@1.0.0-beta.25
  - @nocobase/app-server@5.0.0-beta.0
  - @nocobase/app-cli@1.0.0-beta.32
  - @nocobase/app-plugin-authorization@1.0.0-beta.35

## 0.1.0-beta.12

### Patch Changes

- 27e5adc: Restore evidence-backed data model associations through guarded service factories while retaining unknown, mutation, escape, and termination barriers.

## 0.1.0-beta.11

### Patch Changes

- cf23bfe: Move Redis realtime broadcasting to the commercial Realtime Redis plugin. Register its Server plugin before selecting Redis in an application, or import the standalone broker from its `/broker` entry. Preserve the Memory default, service identity, authorization and recovery protocol, and republish runtime consumers against the new host and realtime major versions. Install the compatible commercial cohort before deploying the final removal.
- Updated dependencies [88d35b8]
- Updated dependencies [83f28b1]
- Updated dependencies [88d35b8]
- Updated dependencies [88d35b8]
- Updated dependencies [83f28b1]
- Updated dependencies [cf23bfe]
- Updated dependencies [b29a336]
  - @nocobase/app-client@4.0.0-beta.6
  - @nocobase/app-plugin-authorization@1.0.0-beta.34
  - @nocobase/app-plugin-authentication@2.0.0-beta.17
  - @nocobase/app-server@4.0.0-beta.0
  - @nocobase/app-cli@1.0.0-beta.31

## 0.1.0-beta.10

### Patch Changes

- 54a4215: The App Foundation page combines duplicate static navigation groups and reports physical foreign keys separately from logical relationship fields.

  应用底座页面会合并重复的静态导航分组，并将物理外键与逻辑关联字段分别统计。

- Updated dependencies [b6934ad]
- Updated dependencies [d3f0c92]
- Updated dependencies [a0b4568]
- Updated dependencies [12b1f64]
- Updated dependencies [b6934ad]
- Updated dependencies [5ce4a7c]
- Updated dependencies [b6934ad]
- Updated dependencies [171f7fb]
  - @nocobase/app-plugin-authentication@2.0.0-beta.16
  - @nocobase/app-client@4.0.0-beta.5
  - @nocobase/app-server@3.0.0-beta.5
  - @nocobase/db@1.0.0-beta.24
  - @nocobase/app-cli@1.0.0-beta.30

## 0.1.0-beta.9

### Patch Changes

- 05f800a: Publish editable file upload/preview and notification delivery-log UI through the UI Library. Install `@nocobase/file-component-ui` or `@nocobase/notification-logs-ui` with shadcn, and merge their bundled locale resources into the consuming application. Existing application-owned copies remain usable; reconcile upstream changes while preserving customizations. The default template keeps its File UI installation path and now tracks the UI Library source.

  Remove plugin-owned Registry recipes, their build/materialize commands, the Registry example plugin, and the `registry` capability from the plugin scaffold. Plugins can continue to install UI Library items into their own client source. Update plugin development guidance to use this single source distribution channel.

  Preserve custom file download callbacks for images opened from FileList, including preview toolbar and fallback downloads.

- Updated dependencies [7770b46]
- Updated dependencies [7770b46]
  - @nocobase/app-cli@1.0.0-beta.28

## 0.1.0-beta.8

### Patch Changes

- d61fff2: Recognize proven official authorization identity continuation and pure local documentation factories when collecting API dependencies. Keep unknown extensions, authority escapes and terminating paths conservative. Add the identity-resolution success condition to version-1 manifests; builders and readers must be upgraded and rolled back together because earlier readers reject this condition.

## 0.1.0-beta.7

### Patch Changes

- 9de4995: Keep observed statistics visible when registered extensions await recognition. Show identified tables and counted results without asserting business ownership or exhaustive coverage, omit metrics without a reliable value, and preserve real zero, dated history and genuine read failures.

## 0.1.0-beta.6

### Patch Changes

- b51bc80: Reuse validated compiled page associations within each application instance while refreshing dynamic evidence normally. Show a lightweight initial collecting placeholder, retain known counts during refresh, and group the Examples Foundation menu with system management.
- b51bc80: Preserve proven normal-success API dependencies with explicit database and framework middleware conditions in Foundation details and source-free builds. Retain unknown and terminating path barriers, and cover the Examples Articles build and request rejection behavior.
- b51bc80: Verify resolved import provenance before applying framework success-path contracts, keeping local overrides and unresolved local aliases from creating false capability associations.
- b51bc80: Keep reliable Foundation observations with their original dates when reads fail, show pending information instead of unsupported negative conclusions, and distinguish partial file statistics from complete totals. Use the top Refresh button for capability updates and retain page retry when the initial overview request fails.

## 0.1.0-beta.5

### Patch Changes

- 7085345: Recognize explicitly declared package-local TypeScript path aliases and finite local route constructors when collecting page capability associations. Keep unresolved aliases and unsupported route computation incomplete, preserve package boundaries and source limits, and retain the existing build artifact format.
- Updated dependencies [756f3df]
  - @nocobase/app-plugin-authentication@2.0.0-beta.14

## 0.1.0-beta.4

### Patch Changes

- c69d6e5: Follow proven Hono handler order when associating API dependencies with business modules. Preserve middleware and explicit continuation, omit unreachable or uncertain downstream contributions, and retain other confirmed evidence when analysis is incomplete. Respect registration exits and class initialization boundaries, and avoid certain matches for unsupported wildcard suffixes. Rebuild and deploy consuming applications to regenerate their module association artifacts.
- 5edb056: Read the application's package inventory and built page associations from its server package when an embedded host points the application root at the archive extraction directory.
- Updated dependencies [58531da]
  - @nocobase/app-client@4.0.0-beta.3
  - @nocobase/app-cli@1.0.0-beta.27
  - @nocobase/app-server@3.0.0-beta.3
  - @nocobase/db@1.0.0-beta.22
  - @nocobase/i18n@2.0.0-beta.1
  - @nocobase/service-provider@0.0.2-beta.2
  - @nocobase/app-plugin-authentication@2.0.0-beta.13
  - @nocobase/app-plugin-authorization@1.0.0-beta.31

## 0.1.0-beta.3

### Patch Changes

- 040b540: Recognize backend routes and service providers in published plugin layouts. Preserve confirmed data-model catalog totals and partial schema statistics when Collection definitions are missing or unreadable, without exposing driver errors.

## 0.1.0-beta.2

### Patch Changes

- 4d61361: Recognize data-model dependencies in existing applications that resolve the API client through useService, return memoized request helpers, generate routes from literal tuples, or register backend routes through local helpers. Keep request paths paired with their own HTTP methods and preserve the associations in source-free deployment manifests without executing application code.

## 0.1.0-beta.1

### Patch Changes

- 4c23514: Bound Foundation database reads and Collection previews, make exact business record counts explicit with retained timestamps, add protected searchable Collection pages, recognize composed APIs and explicit service dependencies in the module matrix, and label matrix icons with accessible tooltips.

  Keep Collection evidence compact with bounded name tags and move the searchable catalog into a height-limited dialog with automatic, composition-aware search and fixed pagination controls.

  Recognize enabled model services as AI capability use for native OnlineAgent and model gateway applications without requiring stored Agent records, preserve independent Runner evidence, and leave unreadable configuration unconfirmed.

- Updated dependencies [f8f64ad]
  - @nocobase/app-server@3.0.0-beta.2
  - @nocobase/app-plugin-authentication@2.0.0-beta.12

## 0.1.0-beta.0

### Minor Changes

- 62da032: Add App Foundation for administrators with unrestricted access: a dynamic capability overview, live statistics, business-module associations, qualitative value explanations, and resolved provider package versions. Collect evidence read-only inside the plugin, include recognized installed capabilities and registered extensions, and distinguish installation, registration, configuration and use. Support all ten Client locales and responsive layouts.

  Derive module associations from registered navigation, authentication and authorization declarations, bounded value-reachable source references, and explicitly matched API handlers. Ignore unused imports, type-only references and unrelated handlers. Keep unsupported or unreadable evidence undetermined rather than guessing usage; report incomplete counts and refresh failures. Cache successful overviews for 30 seconds with a manual refresh action.

  Expose optional immutable Client and Server registration snapshots so the plugin can discover provider-only and locales-only registrations without reloading contributions. Keep collection, classification, authorization and presentation in the Foundation plugin.

  Show deduplicated related package names and versions once within capability details, keeping technical discovery counts and diagnostic evidence internal. Export a permission-preserving helper for placing the Foundation link last in an existing settings navigation group.

### Patch Changes

- 62da032: Install and register App Foundation in the default template so unrestricted administrators can inspect an empty application immediately. Provide a localized settings group that merges into application-owned settings as business administration is added, while retaining the protected /foundation route and server authorization.
- 62da032: Preserve application module capability associations in a validated deployment artifact generated by the Foundation CLI build hook, without shipping business source code. Register the hook in the default template. Read all permission configuration pages before reporting totals, and synchronize the generated UI Registry catalog.
- Updated dependencies [62da032]
- Updated dependencies [8b30952]
- Updated dependencies [4f0d96e]
  - @nocobase/app-client@4.0.0-beta.1
  - @nocobase/app-server@3.0.0-beta.1
  - @nocobase/app-cli@1.0.0-beta.26
  - @nocobase/app-plugin-authentication@2.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.30

## 0.0.1

### Patch Changes

- Add the initial plugin scaffold.
