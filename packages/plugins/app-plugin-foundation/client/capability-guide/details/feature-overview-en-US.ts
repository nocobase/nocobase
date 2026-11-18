import type {
  FeatureOverviewId,
  FeatureOverviewText,
} from './feature-overview-catalog.js';

const entries = {
  'app-plugin-api-keys': {
    inspect:
      'Keys belong to the account that creates them. Your keys and the available creation rules are shown separately below.',
    capabilities: [
      'Create separate named keys with expiration for scripts, scheduled jobs and external systems.',
      'Access the application with the owner’s existing permissions; where the application offers scope groups, narrow the allowed operations and records further.',
      'List, rotate and revoke keys. The original secret is returned only when a key is created or rotated.',
    ],
    configuration:
      'Each key has a name, purpose, lifetime and optional scope. The application decides who may create keys, which scope groups are available and the maximum lifetime of scoped keys. Authentication options control request rate limits. The current-application card shows only rules returned by the API.',
    example:
      'For a daily sales export, use an account with sales read access and create a separate key for the reporting system. If the application offers a matching scope group, restrict the key to read access as well. Store it in the reporting system’s credential configuration and call the application API on schedule.',
    boundary:
      'A key cannot exceed its owner’s permissions. Revoking one key leaves the account’s other keys intact. Rotation invalidates the old secret immediately, so update the caller at the same time.',
    steps: [
      'Have the development Agent read the plugin Skill and inspect existing key pages and APIs, reusing any existing implementation.',
      'Complete personal key listing, creation, rotation and revocation with real policy and scope options; show each full secret only once.',
      'Register the page and add it to the top-right account menu. Use the stable apiKeysManagement route name so the capability guide can find its entry.',
      'Verify sign-in and permissions, empty and error states, key operations and the management link, then return the working page URL.',
    ],
    prompt:
      'Add a working My API keys management interface to this NocoBase application.\n\nPlace the entry in the top-right account menu → API keys. Reuse an equivalent existing page and complete its entry point instead of creating a duplicate.\n\n1. Read the installed nocobase-app-plugin-api-keys Skill and verify it against this version’s source and API document. Inspect plugin registration, authentication configuration, migrations and existing routes. Preserve existing settings and keys.\n\n2. Use the application’s components and API client to list, create, rotate and revoke only the signed-in account’s keys. Reuse GET /api/apiKeys, GET /api/apiKeys/scopeOptions and the existing mutation endpoints; never write the key table directly. Show name, purpose, scope, lifetime and status. Use the returned creation policy and scope options; do not invent groups when none are offered. Show a full secret only once after creation or rotation, with copying, and never log it. Explain and confirm rotation and revocation.\n\n3. Register the real page in client/routes.ts, require sign-in, and follow the application’s route and server permission rules. Use the stable route name apiKeysManagement and preferably /account/api-keys, without hard-coding the /main deployment prefix. Add the entry to the application’s existing account menu. If reusing another route name, update the entry contract in the stable management route convention so Features and extensions can discover the real page. Do not set a configured flag manually.\n\n4. Complete English and Chinese copy, loading, empty, forbidden, expired-session and retry states. Manage only the caller’s keys. Honor the mayCreate policy for creation and rotation. Key management requires a signed-in session.\n\n5. Use isolated tests for listing, one-time secret display, copying, rotation, revocation and denied access. Do not generate real credentials automatically in this application. Verify the account-menu entry, page interactions and Features and extensions management link in the browser. Finish only when the page can be opened and its key operations have been verified; return its URL, changes and validation results.',
  },
  'app-plugin-authentication': {
    inspect:
      'Inspect the sign-in methods offered on the current login page, registration and password recovery. A real login result establishes more than an installed dependency.',
    capabilities: [
      'Sign in with account credentials and maintain sessions and sign-out.',
      'Integrate enterprise sign-in or additional verification methods when needed.',
      'Handle password recovery, disabled accounts and invalid sessions.',
    ],
    configuration:
      'Authentication methods, session lifetime and cookies belong to auth configuration. Public origin, trusted origins and verification email delivery must match the deployment. Enterprise sign-in may also need integration and UI.',
    example:
      'Employees use company sign-in while external collaborators use controlled accounts; both still receive separate business permissions.',
    boundary:
      'Successful authentication does not grant all business access. Hiding a page does not protect its API.',
    steps: [
      'Decide the audience, methods, registration and recovery policies.',
      'Review auth, public origins and email delivery; integrate methods through the relevant Skill.',
      'Keep login, registration and recovery pages consistent with enabled methods.',
      'Verify login, logout, expiry, disabled accounts and deployed callbacks.',
    ],
    prompt:
      'Configure [sign-in method] for [application]. Read nocobase-app-plugin-authentication and inspect auth configuration, login UI, public origin and trusted origins. Reuse installed authentication capabilities and add required migrations and UI. Preserve independent business authorization. Verify login, logout, recovery and disabled accounts without opening registration or granting broad access by default.',
  },
  'app-plugin-concurrency': {
    inspect:
      'Inspect which operations use concurrency control and whether the deployment has one process or several. Configuring the service alone does not protect every save or submission.',
    capabilities: [
      'Serialize critical operations on the same resource.',
      'Wait for a busy resource or explicitly report that it is busy.',
      'Separate independent business resources and coordination domains.',
    ],
    configuration:
      'Concurrency configuration selects the default implementation, namespace and supported options; the application connects individual operations. The built-in implementation coordinates one process only; multiple processes need a shared implementation.',
    example:
      'Two operators settle the same bill: only one enters the critical section while the other waits or receives a busy result.',
    boundary:
      'Coordination does not replace transactions, uniqueness constraints or idempotency. A lease duration is not a task timeout.',
    steps: [
      'Identify competing resources and stable resource keys.',
      'Choose an implementation for the deployment and review concurrency configuration.',
      'Connect critical steps and define waiting, busy and cancellation behavior.',
      'Run concurrent operations and verify consistent results and recovery after failure.',
    ],
    prompt:
      'Add concurrency control to [bill settlement]. Read nocobase-app-plugin-concurrency and coordinate by bill ID using the existing application service. Check whether deployment spans processes; preserve transactions and idempotency. Provide waiting and busy feedback and test competing submissions and failure cleanup. Do not describe local locks as cross-instance locks.',
  },
  'app-plugin-database-explorer': {
    inspect:
      'Open System settings → System → Database Explorer, then choose a connection and collection. The Database detail also provides a connection overview; this guide does not duplicate schema data.',
    capabilities: [
      'Browse collections by connection and distinguish data sources.',
      'Inspect resolved fields, relationships and resolution warnings.',
      'Compare physical columns, indexes and constraints.',
    ],
    configuration:
      'Database configuration owns connections; the explorer reads their structure. Grant explorer access separately to people who need a global schema view, independently of row access to a business collection.',
    example:
      'Before integrating customer data, find the CRM connection and confirm the customer collection, key and contact fields to design the mapping.',
    boundary:
      'This is a schema browser, not a data entry or online schema editor. New connections and structural changes use application configuration and migrations.',
    steps: [
      'Open Database Explorer and choose the connection.',
      'Find a collection and inspect its fields and warnings.',
      'Compare physical columns and indexes when diagnosing discrepancies.',
      'For a missing connection follow the Database guide; for denied access request explorer permission.',
    ],
    prompt:
      'Inspect the [customer] collection in [CRM]. Read nocobase-app-plugin-database-explorer and use read-only connection, collection, field and physical-schema APIs. Explain mappings and warnings without changing tables, records or credentials. Provide separate setup steps if a connection must be added.',
  },
  'app-plugin-file': {
    inspect:
      'Inspect attachment controls on business forms, storage, upload limits and access policies. Installing the file plugin alone creates neither business file collections nor a file management page.',
    capabilities: [
      'Upload files and associate them with contracts, customers or documents.',
      'Preview images, PDFs and common documents and download originals.',
      'Set upload limits and access policies for each business use.',
    ],
    configuration:
      'Drive configuration selects disks and storage locations. The application owns file collections, business associations, upload limits, content authorization and cleanup. Local and supported object-storage drivers can be configured.',
    example:
      'Upload a signed contract on its detail page. Salespeople access only attachments of permitted contracts, and failed form saves retain uploaded files for resubmission.',
    boundary:
      'Deleting metadata does not delete stored objects. External previews of legacy Office formats may need a public URL and are not the default for restricted files.',
    steps: [
      'Define ownership, formats, size limits and read/delete access.',
      'Configure storage and create application-owned file collections and associations.',
      'Reuse file upload and preview UI with authorized content endpoints.',
      'Verify upload, association, preview, download and denied access; define orphan cleanup.',
    ],
    prompt:
      'Add files to [contracts]. Read nocobase-app-plugin-file, inspect existing collections, drive configuration and UI Library components, and reuse upload and preview. Save associations, enforce [format and size limits], and authorize previews and downloads through contract access. Test failed-save recovery, unlinking and denied access; describe physical cleanup separately.',
  },
  'app-plugin-foundation': {
    inspect:
      'This catalog follows application dependencies and supports source and keyword filters. Dependencies identify components; configuration status reports registration only.',
    capabilities: [
      'Find core modules, plugins and declared examples in one place.',
      'Learn each capability’s purpose, configuration location and boundaries.',
      'Give an Agent a concrete development request or follow configuration steps.',
    ],
    configuration:
      'The catalog comes from dependencies and editorial guides; config.yml does not install plugins. Applications can provide specialized details such as a connection overview or combined authorization guide.',
    example:
      'Before adding sales attachments, read File management to understand storage, permissions and record associations, then describe the business entry an Agent should build.',
    boundary:
      'This is not a plugin installer, and listed capabilities are not necessarily enabled or configured.',
    steps: [
      'Search by business task and read the relevant detail.',
      'Check integration and required configuration, not just the dependency.',
      'Use the development request or configuration steps.',
      'Verify the result in the actual business page and add application-specific guidance when needed.',
    ],
    prompt:
      'Inspect existing features and extensions for [business goal]. Read the relevant plugin Skills and distinguish dependencies, integration and business configuration. Identify reusable capabilities, missing configuration and verification steps. State any new dependency needed instead of treating a catalog entry as an enabled feature.',
  },
  'app-plugin-knowledge': {
    inspect:
      'Inspect spaces, documents and access in the knowledge page. For semantic search, also inspect global indexing, the selected index instance and Embedding model.',
    capabilities: [
      'Organize articles and files in spaces with version history.',
      'Allow direct edits or proposed revisions for authorized reviewers.',
      'Use keyword search and optionally add semantic indexing.',
    ],
    configuration:
      'Spaces, content and access are managed in Knowledge. Knowledge configuration declares index instances; global index management selects and enables one with a model. Declaration alone does not enable indexing.',
    example:
      'A support team maintains product manuals: members read and propose revisions, maintainers review changes, and Agents retrieve only permitted material.',
    boundary:
      'Semantic indexing needs additional configuration and rebuilding may incur model charges. Keyword search does not establish that semantic search is enabled.',
    steps: [
      'Define spaces, sources and read/propose/edit/manage responsibilities.',
      'Integrate the knowledge page and access policies, then import a small approved sample.',
      'If semantic search is needed, configure an index and Embedding model and confirm the rebuild scope.',
      'Verify search, version updates and denied access to restricted material.',
    ],
    prompt:
      'Integrate Knowledge for [support team]. Inspect installed public APIs, pages and access policies; reuse spaces, documents, versions and proposals. Start with keyword search. For semantic search, explain index configuration, the Embedding model and rebuild cost before enabling it. Verify that Agents and ordinary members cannot retrieve unauthorized material.',
  },
  'app-plugin-mail': {
    inspect:
      'Inspect connected accounts, synchronization and submission records in the application’s mail workspace. Add that workspace if absent; provider configuration alone does not connect an account.',
    capabilities: [
      'Connect Gmail, Microsoft 365 or IMAP/SMTP accounts.',
      'Read messages, compose drafts, reply and handle attachments.',
      'Associate correspondence with customers and diagnose synchronization and submissions.',
    ],
    configuration:
      'Mail providers configuration declares provider instances and connection settings; users connect accounts through authorization. A user mailbox and a system notification sender serve different purposes.',
    example:
      'Sales staff read and reply to customer correspondence using their authorized mailbox and diagnose account-specific synchronization failures.',
    boundary:
      'Provider acceptance is not proof that a recipient read a message. Check uncertain submissions before sending again.',
    steps: [
      'Choose a provider and prepare authorization and callback settings.',
      'Configure provider instances and integrate the workspace and business associations.',
      'Have the owner connect the account and confirm initial synchronization and access.',
      'Check sync results and verify sending and attachments with authorized test recipients.',
    ],
    prompt:
      'Integrate [mail provider] into [sales application]. Read nocobase-app-plugin-mail, inspect mail.providers and the existing workspace, and associate [customer] records. Define sync scope and account access. Prepare integration without authorizing real mailboxes or sending messages unasked; live tests use confirmed accounts and recipients and retain sync/submission evidence.',
  },
  'app-plugin-notification': {
    inspect:
      'Inspect configured channels, business templates and delivery records in notification management. They separately explain what is sent, how it is sent and what happened.',
    capabilities: [
      'Select recipients, content and channels for business events.',
      'Record notifications, deliveries and individual attempts.',
      'Retry eligible failures under control and retain business references.',
    ],
    configuration:
      'Notification channels configuration declares named channels. The application defines business scenarios and content and provides a template directory. Email, inbox and IM require their respective implementations and settings.',
    example:
      'A transferred ticket notifies its new owner in the inbox, while an important timeout also reaches the team channel. Administrators inspect each delivery separately.',
    boundary:
      'Submitted does not mean delivered. Failure of one channel does not imply failure of all channels. Logical resubmission needs idempotency.',
    steps: [
      'Define events, recipients, language and content; separate ordinary notifications from credential messages.',
      'Configure channels and integrate the real template directory and read permissions.',
      'Send after business commit with source references and idempotency.',
      'Use authorized test recipients to verify success, failure and retries per channel.',
    ],
    prompt:
      'Add notifications for [ticket transfer]. Read nocobase-app-plugin-notification and reuse channels and template rendering. Define [recipients] and content, expose the template directory and authorized delivery records, and send after commit without duplication. Preview synthetic content first; actual sends target confirmed recipients. Distinguish submission from delivery.',
  },
  'app-plugin-notification-in-app': {
    inspect:
      'Open the inbox to inspect your messages and unread count. An empty inbox may simply mean no business event has sent a message to this user.',
    capabilities: [
      'Persist personal notifications across refreshes and sign-ins.',
      'Mark items read or unread and maintain personal unread counts.',
      'Refresh on updates and navigate to permitted business records.',
    ],
    configuration:
      'Configure an in-app channel under notification channels and integrate the inbox. Business code chooses events and recipients; realtime helps refresh but does not store messages.',
    example:
      'A task assignment appears in your inbox. Marking it read in another window also refreshes the current window’s unread count.',
    boundary:
      'People can access only their own inbox. A notification link does not grant access to its business target.',
    steps: [
      'Check the notification runtime, in-app channel and inbox entry.',
      'Send business events to specific users with business navigation targets.',
      'Integrate unread counts and refetch persisted messages after reconnecting.',
      'Verify recipient isolation, read/unread operations and reopening the page.',
    ],
    prompt:
      'Integrate in-app notifications for [application]. Read nocobase-app-plugin-notification-in-app and reuse inbox UI and channels for [task assignment]. Use current-user message APIs and authorized business links. Test read state across windows, reconnect recovery and user isolation. Do not replace persistent notifications with temporary toasts.',
  },
  'app-plugin-notification-providers': {
    inspect:
      'Inspect named channels, their types and enabled state, then check actual delivery records. This page does not read Webhooks or mail credentials.',
    capabilities: [
      'Send email through shared mailers, SMTP or Resend.',
      'Send team messages through Feishu or DingTalk Webhooks.',
      'Configure independent named channels for different purposes.',
    ],
    configuration:
      'Each notification channel declares a type and its settings. Email can reference an application mailer; Feishu and DingTalk use their Webhooks. In-app delivery is supplied separately.',
    example:
      'Routine tasks use the inbox, on-call alerts use a Feishu group and customer confirmations use email, with content prepared for each channel.',
    boundary:
      'Email addresses, group Webhooks and application user IDs are distinct recipients. Channels do not automatically resolve users to external addresses.',
    steps: [
      'Choose the use and channel type and confirm authorized recipients or groups.',
      'Configure named channels and private credentials; reuse mailers for email when appropriate.',
      'Prepare complete per-channel content and resolve addresses where needed.',
      'Send to authorized test targets and inspect each result and error classification.',
    ],
    prompt:
      'Configure [email/Feishu/DingTalk] for [business notification]. Read the Notification Skill and built-in channel guidance; inspect notification.channels and mailers. Use explicit channel names and authorized targets, inject credentials securely and render content per channel. Send only to confirmed test targets and inspect final delivery records.',
  },
  'app-plugin-scheduler': {
    inspect:
      'Inspect names, schedule times, timezones, enabled state and runs in task management. An empty list may require application definitions and synchronization.',
    capabilities: [
      'Show source-defined schedules and their business targets.',
      'Enable or disable tasks with the appropriate permission.',
      'Distinguish triggering, execution and final completion and inspect failures.',
    ],
    configuration:
      'Application code defines schedules and targets; scheduler.jobs selects a jobs configuration. Management controls enablement but is not a general Cron definition editor.',
    example:
      'Generate yesterday’s sales summary each morning. An administrator can pause it and verify that a particular run produced its report.',
    boundary:
      'Invisible recurring work can use the jobs service directly. One-time delays belong to queues.',
    steps: [
      'Identify schedules, outcomes and history administrators need.',
      'Define targets, times, timezone and idempotency and choose a suitable jobs backend.',
      'Synchronize definitions and integrate management, permissions and completion reporting.',
      'Verify enablement, actual execution, failures and recovery without treating dispatch as completion.',
    ],
    prompt:
      'Add a scheduled [daily sales summary]. Read nocobase-app-plugin-scheduler and define [time and timezone] and the business target using existing jobs configuration. Deliver the schedule directory, enable/disable permissions and run history; report asynchronous completion. Test recovery and idempotency without inventing a Cron editing API.',
  },
  'app-plugin-template-print': {
    inspect:
      'This extension supplies a development Skill, not a callable printing runtime. Check whether the application already implements templates, authorized data loading and downloads.',
    capabilities: [
      'Plan DOCX, XLSX or PPTX generation from business templates.',
      'Specify one record, selected records or filtered results as the output scope.',
      'Optionally add PDF conversion, attachments, images or QR codes.',
    ],
    configuration:
      'The application implements template ownership, mapping, rendering and download authorization. There is no universal config.yml switch that delivers printing; PDF also depends on deployed converters.',
    example:
      'Generate a quotation from its detail using only the caller’s permitted quotation data and a designated template.',
    boundary:
      'This is implementation guidance, not a printing runtime. Validate each format; a DOCX example does not prove every format is ready.',
    steps: [
      'Provide the actual template, output format and data scope.',
      'Use the Template Print Skill to select an implementation and mapping.',
      'Build authorized generation and downloads and deploy conversion tools if needed.',
      'Verify content, pagination, fonts and denied records with the real template.',
    ],
    prompt:
      'Generate [quotation] from [provided template] as [DOCX/PDF]. Read nocobase-app-plugin-template-print, define scope and template ownership, then integrate a renderer. Reuse business authorization and reject arbitrary file paths. Validate lines, pagination, fonts and downloads with the actual template; verify deployed PDF conversion separately.',
  },
  'app-plugin-users': {
    inspect:
      'Inspect account state and role sources in user management. If the page is absent, integrate the existing management capabilities rather than writing account tables directly.',
    capabilities: [
      'Create accounts or invite people and maintain profile information.',
      'Disable or enable accounts, reset passwords and revoke sessions.',
      'Inspect and assign permitted roles while preserving protected assignments.',
    ],
    configuration:
      'Accounts and assignments are application data; users configuration controls initialization and invitation options, with application mailers for invitations. Initial-administrator settings do not reset existing accounts.',
    example:
      'Create an account and assign the relevant role when a colleague joins; disable it on departure to invalidate existing sessions.',
    boundary:
      'A role is one grant source. Removing it may leave access from another role; inspect effective permissions.',
    steps: [
      'Define who can administer users and which role assignments they may change.',
      'Integrate management and action permissions and configure invitation mailers if needed.',
      'Create or invite identified people and display saved roles and sources.',
      'Verify disabling, session revocation and ordinary-account access while preserving administrator safeguards.',
    ],
    prompt:
      'Improve user management for [application]. Read nocobase-app-plugin-users and reuse user APIs and role scopes for profiles, invitations, enablement and assignments. Define management authority and protected roles without granting business roles to all signed-in users. Verify session invalidation, role sources and denied actions.',
  },
  jobs: {
    inspect:
      'Inspect business tasks, their selected jobs configuration and result pages. The core module does not supply a universal task management page.',
    capabilities: [
      'Run one-off exports, parsing and computation in the background.',
      'Report progress, results and failures and retry according to policy.',
      'Run recurring work that does not require administrator-facing controls.',
    ],
    configuration:
      'Jobs configuration selects a backend, concurrency, attempts and persistence location. Built-in memory serves one process and saves state on graceful shutdown; coordinated instances need an additional shared implementation.',
    example:
      'A report request returns a task status while the background job creates the file. The page shows real progress and an authorized download when complete.',
    boundary:
      'Jobs does not provide every queue feature: use queues for delay or priority and Scheduler for administrator-visible schedules.',
    steps: [
      'Define inputs, results, progress and retry conditions.',
      'Check that the backend fits process count and recovery needs.',
      'Integrate execution, result persistence and UI feedback with idempotent effects.',
      'Verify failure, restart and replay against actual business outcomes.',
    ],
    prompt:
      'Move [report export] into background jobs. Inspect installed jobs APIs and application configuration and reuse the application executor. Persist real progress and results with download authorization. Design idempotency and recovery and test restarts. Select queue only when delay or priority is required; do not assume memory coordinates multiple processes.',
  },
  lifecycle: {
    inspect:
      'Inspect application-defined processes, state diagrams, parameters and execution history. Depending on the core module does not automatically create a process directory.',
    capabilities: [
      'Show a record’s state and permitted next actions.',
      'Validate actors, input and business conditions and record each transition.',
      'Run post-commit work such as notifications with retries or continuations.',
    ],
    configuration:
      'The application defines states, transitions and guards. Administrator-editable parameters need explicit definitions and management UI; config.yml does not replace process definitions.',
    example:
      'A support ticket waits for a customer reply and closes after a configured duration, retaining each actor and outcome.',
    boundary:
      'This is record-based business flow support, not an arbitrary visual workflow builder or an included approval center.',
    steps: [
      'Describe states, actors, actions, prerequisites and exceptional paths.',
      'Define and persist the lifecycle and authorize business actions.',
      'Deliver a process directory, standard diagram, configurable parameters and history.',
      'Verify duplicate requests, concurrent transitions and recovery of failed effects.',
    ],
    prompt:
      'Build a [support ticket] business lifecycle with [states and transitions]. Inspect lifecycle APIs and existing process Skills and reuse standard diagrams and management UI. Define permissions, validation, parameters and effects; deliver the directory, configuration and history. Test concurrency, duplicate submissions and recovery without maintaining a second record-state source.',
  },
  queue: {
    inspect:
      'Inspect queue consumers, queue names and where outcomes are persisted. Queue configuration describes execution backends, not a business queue inventory.',
    capabilities: [
      'Delay messages or prioritize waiting work.',
      'Deduplicate by job identity and configure attempts and backoff.',
      'Organize handlers by channel and control start rates when needed.',
    ],
    configuration:
      'Queue configuration selects default and named implementations and concurrency, retries and retention. InMemory serves one process and saves unfinished work on clean shutdown; multiple instances need a shared backend.',
    example:
      'Check an order ten minutes after creation and remind only if unpaid. Use a stable identity for each order/check cycle to avoid duplicate submissions.',
    boundary:
      'Queue deduplication is not permanent exactly-once business execution. Replay, retries and history cleanup still require business idempotency.',
    steps: [
      'Check whether jobs suffices and identify required delay, priority or rate limits.',
      'Choose configuration, namespace and deployment-appropriate backend.',
      'Register handlers, persist outcomes and define retries and deduplication.',
      'Verify duplicate messages, delay, failure recovery and shutdown behavior.',
    ],
    prompt:
      'Implement [check payment ten minutes after order creation]. Inspect queue APIs and reuse the application service with stable order/check-cycle IDs. Re-read payment state before acting, enforce idempotency and record results and failures. Choose a backend for deployment size and test delay, duplication, retries and restart; do not substitute queue deduplication for business validation.',
  },
  realtime: {
    inspect:
      'Inspect subscribed business pages and whether deployment spans processes. A connected socket alone does not prove that pages refetch fresh business state.',
    capabilities: [
      'Announce record changes, task progress or personal notification updates.',
      'Authorize subscriptions by user and resource.',
      'Refetch current data after reconnecting to restore the view.',
    ],
    configuration:
      'Realtime configuration selects the backend, namespace and connection limits. InMemory broadcasts within one process; multiple instances need an additional shared implementation. Applications define topics and business access.',
    example:
      'Two people view a task board: one changes a task and the other refreshes automatically. Reconnecting after going offline also reads current records.',
    boundary:
      'Realtime events are transient signals, not stored business records. Authorized business APIs remain authoritative.',
    steps: [
      'Identify changes and authorized user/resource audiences.',
      'Choose a deployment backend, define topic access and publish after commit.',
      'Read snapshots after subscription acknowledgement and reconnect; coalesce event-driven refetches.',
      'Verify collaboration, reconnects, revoked access and cross-instance boundaries.',
    ],
    prompt:
      'Add realtime updates to [task board]. Read nocobase-realtime and reuse the application service and business authorization. Publish small post-commit signals, then refetch authoritative data after subscription acknowledgement and reconnect. Coalesce refreshes and test user isolation, reconnect recovery and permission revocation; confirm a shared backend for multiple instances.',
  },
  'app-plugin-authorization-example': {
    inspect:
      'Open the registered authorization example and inspect projects, quotes and orders; confirm optional rule plugins for the intended exercises.',
    capabilities: [
      'Compare access and actions across responsibilities.',
      'Observe default scopes, sharing and restrictions together.',
      'Distinguish editing a quote from submitting it or delivering an order.',
    ],
    configuration:
      'The example needs authentication, authorization and the rule plugins used by the exercise, plus its own migrations and samples. Design production roles separately.',
    example:
      'Let a collaborator edit a shared quote and confirm that someone without Submit still cannot submit it.',
    boundary:
      'These are independent responsibility exercises, not a complete quote-to-order business process.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'The example needs authentication, authorization and the rule plugins used by the exercise, plus its own migrations and samples. Design production roles separately.',
      'Use the documented demo accounts to compare project, quote and order access.',
      'Verify both allowed actions and rejected API requests, including combined sharing and restriction rules.',
    ],
    prompt:
      'Adapt [authorization-example] for [business goal]. Inspect its source and the relevant installed Skills. Use the documented demo accounts to compare project, quote and order access. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify both allowed actions and rejected API requests, including combined sharing and restriction rules. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-cli-example': {
    inspect:
      'This is a CLI example without a business page; inspect cli-example help and registered commands in the application terminal.',
    capabilities: [
      'Declare arguments and options.',
      'Return machine-readable JSON results.',
      'Organize nested development commands.',
    ],
    configuration:
      'Register the example CLI entry; a dependency alone does not add commands. Each business command reads only its required configuration.',
    example:
      'Turn data validation into a command whose result a maintenance script can consume.',
    boundary: 'Demo commands are not a finished business maintenance tool.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'Register the example CLI entry; a dependency alone does not add commands. Each business command reads only its required configuration.',
      'Inspect cli-example help and run the read-only greet command before designing business inputs and output.',
      'Verify invalid arguments, ordinary output and JSON; define write scope separately.',
    ],
    prompt:
      'Adapt [cli-example] for [business goal]. Inspect its source and the relevant installed Skills. Inspect cli-example help and run the read-only greet command before designing business inputs and output. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify invalid arguments, ordinary output and JSON; define write scope separately. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-database-example': {
    inspect:
      'There is no dedicated management page; inspect declared database tasks and execution records, then verify results through Database Explorer.',
    capabilities: [
      'Ship required schema through migrations.',
      'Ship required initial data through seeds.',
      'Run tasks through the application database lifecycle.',
    ],
    configuration:
      'Register the example and use application database tasks after checking the target connection and pending work.',
    example:
      'Prepare a sample table and initialization and confirm that restarting does not initialize it twice.',
    boundary:
      'Never rewrite a merged migration; correct schema with a new migration.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'Register the example and use application database tasks after checking the target connection and pending work.',
      'Inspect and apply the example migrations and seeds on an isolated database.',
      'Verify structure, seed results, repeat execution and subsequent migrations.',
    ],
    prompt:
      'Adapt [database-example] for [business goal]. Inspect its source and the relevant installed Skills. Inspect and apply the example migrations and seeds on an isolated database. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify structure, seed results, repeat execution and subsequent migrations. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-file-example': {
    inspect:
      'Inspect uploads, file lists and associations from the registered file example; storage still follows application drive configuration.',
    capabilities: [
      'Exercise upload, preview and download.',
      'Inspect one-to-one and one-to-many file relationships.',
      'Distinguish unlinking from metadata deletion.',
    ],
    configuration:
      'Integrate File and storage first, then initialize the example’s file and business collections.',
    example:
      'Attach a contract and image to a sample record and reopen it to verify associations and previews.',
    boundary:
      'Adapt sample collections and access policies before production use.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'Integrate File and storage first, then initialize the example’s file and business collections.',
      'Use test files to upload, save associations, reopen and unlink.',
      'Verify downloaded bytes, failure recovery and denied access; define object cleanup separately.',
    ],
    prompt:
      'Adapt [file-example] for [business goal]. Inspect its source and the relevant installed Skills. Use test files to upload, save associations, reopen and unlink. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify downloaded bytes, failure recovery and denied access; define object cleanup separately. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-jobs-example': {
    inspect:
      'Open one-off jobs and schedules in the example to observe real progress and runs of the current instance.',
    capabilities: [
      'Submit a one-off job that reports progress.',
      'Start, stop and adjust predefined recurring rules.',
      'Observe restart recovery and realtime progress.',
    ],
    configuration:
      'The example uses application jobs configuration; recurring slots are defined in code, not through a general schedule editor.',
    example:
      'Start a progress task, leave and return, then exercise a rule with an adjustable interval.',
    boundary: 'Teaching records are not a complete cross-instance audit.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'The example uses application jobs configuration; recurring slots are defined in code, not through a general schedule editor.',
      'Observe progress on the jobs page and exercise adjustable rules on the schedules page.',
      'Verify completion, failures, restarts and enablement permissions; submitted is not completed.',
    ],
    prompt:
      'Adapt [jobs-example] for [business goal]. Inspect its source and the relevant installed Skills. Observe progress on the jobs page and exercise adjustable rules on the schedules page. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify completion, failures, restarts and enablement permissions; submitted is not completed. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-lifecycle-example': {
    inspect:
      'Inspect states, parameters, transition history and effects in registered examples, distinguishing real mechanisms from sandbox business effects.',
    capabilities: [
      'Observe actors performing state actions.',
      'Exercise waiting, timeouts, retries and compensation.',
      'Inspect transitions and effect runs.',
    ],
    configuration:
      'The example uses application databases and jobs; some payment and invoicing providers are sandbox implementations.',
    example:
      'Submit an expense, follow amount-dependent decisions and observe retries after a simulated payment failure.',
    boundary:
      'Demo identity switches and shortened waits are not production policies; sandbox invoices are not tax documents.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'The example uses application databases and jobs; some payment and invoicing providers are sandbox implementations.',
      'Choose a flow, complete its normal path and exercise a supported failure scenario.',
      'Verify state, access, repeated callbacks and recovery and replace demo identities and external sandboxes.',
    ],
    prompt:
      'Adapt [lifecycle-example] for [business goal]. Inspect its source and the relevant installed Skills. Choose a flow, complete its normal path and exercise a supported failure scenario. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify state, access, repeated callbacks and recovery and replace demo identities and external sandboxes. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-mail-example': {
    inspect:
      'Open the example to inspect demo accounts, messages, attachments and sync logs; the page prepares demonstration accounts and data.',
    capabilities: [
      'Try simulated accounts representing different providers.',
      'Compose using templates and signatures.',
      'Inspect synchronization and simulated submission logs.',
    ],
    configuration:
      'Configure the offline provider instances under mail.providers and integrate Mail and its queue configuration.',
    example: 'Reply to a sample message and inspect Sent and activity records.',
    boundary:
      'Offline sending does not prove connectivity to real Gmail, Microsoft or SMTP accounts.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'Configure the offline provider instances under mail.providers and integrate Mail and its queue configuration.',
      'Configure offline providers and exercise the workspace with test content.',
      'Verify attachments, templates, signatures and sync records; validate real providers separately with authorization.',
    ],
    prompt:
      'Adapt [mail-example] for [business goal]. Inspect its source and the relevant installed Skills. Configure offline providers and exercise the workspace with test content. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify attachments, templates, signatures and sync records; validate real providers separately with authorization. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-notification-example': {
    inspect:
      'Inspect tasks, assignees and inbox navigation; the example uses actual application users and durable messages.',
    capabilities: [
      'Create tasks and choose assignees.',
      'Notify related people after changes.',
      'Open authorized tasks from inbox messages.',
    ],
    configuration:
      'Integrate Notification, an in-app channel and required collections; external email or bot credentials are unnecessary.',
    example:
      'Assign a test task to a confirmed test user, then open and update it from the recipient’s notification.',
    boundary:
      'These actions persist real tasks and inbox messages; the demo is not side-effect-free.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'Integrate Notification, an in-app channel and required collections; external email or bot credentials are unnecessary.',
      'Create and reassign tasks within confirmed test accounts and observe recipients and navigation.',
      'Verify creator/assignee access, old/new assignee notifications and denial for unrelated users.',
    ],
    prompt:
      'Adapt [notification-example] for [business goal]. Inspect its source and the relevant installed Skills. Create and reassign tasks within confirmed test accounts and observe recipients and navigation. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify creator/assignee access, old/new assignee notifications and denial for unrelated users. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-office-flows-example': {
    inspect:
      'Inspect requests, documents, work items and department/calendar settings. Demo role switching is not actual user authorization.',
    capabilities: [
      'Show questions conditionally based on earlier answers.',
      'Split departmental work into related child records.',
      'Advance parent records using working days and child outcomes.',
    ],
    configuration:
      'The example supplies departments, management groups and a demonstration calendar; replace people, holidays and business parameters for production.',
    example:
      'A data request creates periodic extraction tasks and cannot finish while a child task remains open.',
    boundary:
      'Attachments retain filenames only; sample people and calendars are not production data.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'The example supplies departments, management groups and a demonstration calendar; replace people, holidays and business parameters for production.',
      'Complete a request or incoming document and inspect child creation, return conditions and work distribution.',
      'Verify parent/child consistency, reminder deduplication, authenticated actors and holiday rules.',
    ],
    prompt:
      'Adapt [office-flows-example] for [business goal]. Inspect its source and the relevant installed Skills. Complete a request or incoming document and inspect child creation, return conditions and work distribution. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify parent/child consistency, reminder deduplication, authenticated actors and holiday rules. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-queue-example': {
    inspect:
      'This example is API-oriented without a dedicated business page; inspect its endpoints and status reads in the application API document.',
    capabilities: [
      'Publish a delayed greeting.',
      'Subscribe multiple handlers to selected channels.',
      'Publish daily digest batches with stable identities.',
    ],
    configuration:
      'queueExample.queue selects a declared application configuration or follows the default queue configuration.',
    example:
      'Republish digests for the same day and check whether retained job IDs prevent duplicate queueing.',
    boundary:
      'Status shows deliveries since this instance started, not a permanent business audit.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'queueExample.queue selects a declared application configuration or follows the default queue configuration.',
      'Use documented example APIs to publish delayed greetings and digest batches in a test environment.',
      'Check handler deliveries, delay, deduplication and anonymous-request denial.',
    ],
    prompt:
      'Adapt [queue-example] for [business goal]. Inspect its source and the relevant installed Skills. Use documented example APIs to publish delayed greetings and digest batches in a test environment. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Check handler deliveries, delay, deduplication and anonymous-request denial. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-realtime-example': {
    inspect:
      'Open tasks, inbox and exports in the realtime example and compare changes in two windows.',
    capabilities: [
      'Refresh shared task views after changes.',
      'Synchronize personal read state across windows.',
      'Track exports and download completed results.',
    ],
    configuration:
      'The example uses Notification Example task data, in-app messages and jobs. Multi-process deployment requires shared realtime and execution verification.',
    example:
      'One person updates a task and another sees it; exports include only records available to their requester.',
    boundary:
      'The example targets one process and does not establish cross-instance broadcasting or coordinated exports.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'The example uses Notification Example task data, in-app messages and jobs. Multi-process deployment requires shared realtime and execution verification.',
      'Use confirmed test users and two windows to exercise tasks, inbox state and exports.',
      'Verify offline recovery, task access, export ownership and persisted results after reopening.',
    ],
    prompt:
      'Adapt [realtime-example] for [business goal]. Inspect its source and the relevant installed Skills. Use confirmed test users and two windows to exercise tasks, inbox state and exports. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify offline recovery, task access, export ownership and persisted results after reopening. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-repository-example': {
    inspect:
      'Inspect CRM and order example lists and details; these are demonstration records, not an existing customer system.',
    capabilities: [
      'Query, create and edit related records.',
      'Exercise filtering, sorting, aggregation and relationship writes.',
      'Verify concurrent editing and atomic updates.',
    ],
    configuration:
      'The example owns collections, migrations, seeds and API policies. Redesign fields and authorization for the actual business.',
    example:
      'Create a customer and contact, inspect their relation and verify that updates do not overwrite concurrent changes.',
    boundary:
      'Learn query and UI patterns without treating sample scopes as production authorization.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'The example owns collections, migrations, seeds and API policies. Redesign fields and authorization for the actual business.',
      'Exercise lists, details, create/edit forms and relationship operations on sample data.',
      'Verify pagination, relationship access, conflicts, aggregates and API authorization.',
    ],
    prompt:
      'Adapt [repository-example] for [business goal]. Inspect its source and the relevant installed Skills. Exercise lists, details, create/edit forms and relationship operations on sample data. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify pagination, relationship access, conflicts, aggregates and API authorization. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-routes-example': {
    inspect:
      'Inspect the registered routes example and its API response; the application owns the deployment prefix.',
    capabilities: [
      'Declare pages with appropriate access.',
      'Read APIs through the application client.',
      'Provide shared context to page components.',
    ],
    configuration:
      'Application or plugin source declares routes; config.yml text does not generate them. Pages and endpoints each need their access policies.',
    example:
      'Add a business list page that reads a protected endpoint when opened.',
    boundary:
      'Requiring login on a page does not authenticate or authorize its API.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'Application or plugin source declares routes; config.yml text does not generate them. Pages and endpoints each need their access policies.',
      'Inspect the page/API declarations and connection before adding a business page.',
      'Verify deep-link refresh, deployment prefixes, signed-out access and endpoint permissions.',
    ],
    prompt:
      'Adapt [routes-example] for [business goal]. Inspect its source and the relevant installed Skills. Inspect the page/API declarations and connection before adding a business page. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify deep-link refresh, deployment prefixes, signed-out access and endpoint permissions. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-service-provider-example': {
    inspect:
      'A status API exposes the example lifecycle; there is no dedicated business page.',
    capabilities: [
      'Provide reusable shared services.',
      'Prepare resources during startup.',
      'Stop work and release resources during shutdown.',
    ],
    configuration:
      'The plugin declares a service within the application lifecycle; application configuration supplies business options.',
    example:
      'Several modules reuse one service instead of creating separate connections and timers.',
    boundary:
      'The demo status endpoint is intentionally public; reassess authentication and authorization for real business state.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'The plugin declares a service within the application lifecycle; application configuration supplies business options.',
      'Inspect started service state and how shutdown releases resources.',
      'Verify instance sharing, dependency order, startup failures and cleanup and protect business endpoints.',
    ],
    prompt:
      'Adapt [service-provider-example] for [business goal]. Inspect its source and the relevant installed Skills. Inspect started service state and how shutdown releases resources. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify instance sharing, dependency order, startup failures and cleanup and protect business endpoints. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-skills-example': {
    inspect:
      'Inspect the supplied Skill, notice component and registered service. Skill synchronization alone does not integrate a business page.',
    capabilities: [
      'Describe public capabilities through a Skill.',
      'Reuse an existing application-notice component.',
      'Read service content through an authenticated API.',
    ],
    configuration:
      'The plugin owns its skills directory and synchronization makes guidance available to the application Agent. The application still decides where components appear.',
    example:
      'Ask an Agent to read the example Skill and place a notice on a chosen page using the existing component and service.',
    boundary:
      'Fixed sample notices have no complex business policy; define actual audience access separately.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'The plugin owns its skills directory and synchronization makes guidance available to the application Agent. The application still decides where components appear.',
      'Read the Skill and inspect the notice component export and service endpoint.',
      'Verify actual service data, anonymous-request denial and adapted business access.',
    ],
    prompt:
      'Adapt [skills-example] for [business goal]. Inspect its source and the relevant installed Skills. Read the Skill and inspect the notice component export and service endpoint. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify actual service data, anonymous-request denial and adapted business access. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
  'app-plugin-template-print-example': {
    inspect:
      'Inspect invoices linked to quotations, caller access and available output formats in the print example.',
    capabilities: [
      'Fill a fixed DOCX template with invoice fields and lines.',
      'Authorize output through access to the linked quote.',
      'Produce PDF when the converter is available.',
    ],
    configuration:
      'The example needs Authorization Example and its data. DOCX rendering works directly; PDF needs the example’s deployed conversion tools such as LibreOffice.',
    example:
      'Download an authorized sample invoice as DOCX; retain that option with an explanation when PDF conversion is unavailable.',
    boundary:
      'The example accepts neither arbitrary uploaded templates nor request-supplied server paths.',
    steps: [
      'Inspect the installed example and its dependencies in an isolated development application.',
      'The example needs Authorization Example and its data. DOCX rendering works directly; PDF needs the example’s deployed conversion tools such as LibreOffice.',
      'Check quotation access and render the fixed template; prepare PDF conversion only if needed.',
      'Verify fields, lines, fonts and denied records, checking real DOCX and PDF output separately.',
    ],
    prompt:
      'Adapt [template-print-example] for [business goal]. Inspect its source and the relevant installed Skills. Check quotation access and render the fixed template; prepare PDF conversion only if needed. Replace demo identities and data with authenticated actors, business authorization and application-owned persistence. Verify fields, lines, fonts and denied records, checking real DOCX and PDF output separately. Do not deploy demonstration access policies or connect external services without confirmed scope.',
  },
} satisfies Record<FeatureOverviewId, FeatureOverviewText>;

export const featureOverview: Readonly<Record<string, unknown>> = {
  ...{
    layout: {
      authorizationInterface: 'Permission management interface',
      defaultAccessInterface: 'Default access management interface',
      messageLanguages: 'Message and notification languages',
      messageUnknown:
        'Message languages could not be confirmed. You can retry.',
      setupFor: 'Add or improve {{feature}}',
      actionsTitle: 'Add or improve with an Agent',
      unknown: 'Not confirmed',
      open: 'Open interface',
      promptHint:
        'Edit and copy this request to the Agent developing the application. This page does not apply configuration automatically.',
      setupTitle: 'Add or improve this feature',
      setupDescription:
        'Inspect the application and complete configuration and management entry points.',
      inspectHint: 'Confirm against the application’s actual configuration.',
      improvePrompt:
        'Improve the current application while preserving existing features, data and permissions: {{goal}}. Confirm the requested change and existing implementation first; change only what is needed. The integration reference below must be adapted to the current setup rather than creating duplicates.',
      databaseDescription:
        'Inspect configured connections and open Database Explorer for tables and fields.',
      databaseAddDescription:
        'Connect another business database while preserving existing connections.',
      databaseTuneTitle: 'Adjust connection configuration',
      databaseTuneDescription:
        'Change the default connection, schema ownership or connection parameters.',
      databaseTunePrompt:
        'Adjust this application’s database connections for [business requirement]. Inspect the current setup and confirm the target connection, preserving other connections and data. Check defaults, schema ownership, connection parameters and deployment overrides. Change only agreed settings; do not migrate data or alter schemas automatically. Verify effective configuration and the Explorer entry afterwards.',
      languagesTitle: 'Available languages',
      languagesDescription:
        'Languages provided by this application: {{languages}}.',
      languageSwitchTitle: 'Language switcher',
      languageSwitchDescription:
        'When multiple languages are available, switch from the top-right account menu.',
      languageDefaultTitle: 'Default language',
      languageDefaultDescription: 'Used on a first visit: {{language}}.',
      addLanguageDescription:
        'Add interface and message translations for another language.',
      defaultLanguageDescription:
        'Change the first-visit language while preserving saved preferences.',
      authorizationDescription:
        'Manage application permission sets and assignments.',
      authorizationActionTitle: 'Add or improve authorization management',
      authorizationActionDescription:
        'Provide management interfaces and configure page, action and record access for business roles.',
      authorizationRulesTitle: 'Improve data access rules',
      authorizationRulesDescription:
        'Configure default access, sharing and restrictions for team collaboration.',
      agentInterfaces: 'Agent management interface',
      agentModels: 'Model management interface',
      agentSkills: 'Skills management interface',
      agentMachines: 'Machine connections interface',
      agentUsage: 'Usage interface',
      agentRouteDescription:
        'Provides the management entry; verify models, connections and business configuration inside it.',
      entries: {
        'app-plugin-authentication': {
          title: 'Sign-in interface',
          extendTitle: 'Add a sign-in method',
          extendDescription:
            'Support account sign-in, enterprise login or password recovery.',
        },
        'app-plugin-concurrency': {
          title: 'Concurrency control',
          extendTitle: 'Adjust concurrency rules',
          extendDescription:
            'Control duplicate submissions, competing resources and simultaneous operations.',
        },
        'app-plugin-database-explorer': {
          title: 'Database Explorer interface',
          extendTitle: 'Adjust browser access',
          extendDescription:
            'Choose who can access the application-wide database structure browser.',
        },
        'app-plugin-file': {
          title: 'File management',
          extendTitle: 'Extend uploads and storage',
          extendDescription:
            'Configure attachment types, storage and file access.',
        },
        'app-plugin-foundation': {
          title: 'Features and extensions interface',
          extendTitle: 'Describe additional features',
          extendDescription:
            'Describe new features, their configuration and Agent setup guidance.',
        },
        'app-plugin-knowledge': {
          title: 'Knowledge base interface',
          extendTitle: 'Extend knowledge and access',
          extendDescription:
            'Add knowledge sources, organize content and control team access.',
        },
        'app-plugin-mail': {
          title: 'Mailbox management',
          extendTitle: 'Connect a mailbox and synchronize mail',
          extendDescription:
            'Configure accounts, synchronization and business links.',
        },
        'app-plugin-notification': {
          title: 'Notification management',
          extendTitle: 'Add business notifications',
          extendDescription:
            'Define notification triggers, recipients and content.',
        },
        'app-plugin-notification-in-app': {
          title: 'Inbox interface',
          extendTitle: 'Extend inbox and business links',
          extendDescription:
            'Deliver business notifications to the inbox with links to records.',
        },
        'app-plugin-notification-providers': {
          title: 'Notification channels',
          extendTitle: 'Configure notification channels',
          extendDescription:
            'Connect email, Feishu or DingTalk as needed by the team.',
        },
        'app-plugin-scheduler': {
          title: 'Scheduled tasks',
          extendTitle: 'Add or adjust schedules',
          extendDescription:
            'Configure timing, business tasks and failure handling.',
        },
        'app-plugin-template-print': {
          title: 'Template printing',
          extendTitle: 'Configure a business print template',
          extendDescription:
            'Turn business records into printable or exportable documents.',
        },
        'app-plugin-users': {
          title: 'User management interface',
          extendTitle: 'Extend user administration',
          extendDescription:
            'Configure profiles, account status and team responsibilities.',
        },
        jobs: {
          title: 'Background jobs',
          extendTitle: 'Add background processing',
          extendDescription:
            'Run time-consuming work in the background and handle retries.',
        },
        lifecycle: {
          title: 'Business processes',
          extendTitle: 'Add or adjust a business process',
          extendDescription:
            'Configure record states, available actions and process history.',
        },
        queue: {
          title: 'Queues',
          extendTitle: 'Configure a task queue',
          extendDescription: 'Control task order, parallelism and retries.',
        },
        realtime: {
          title: 'Realtime updates',
          extendTitle: 'Add realtime business updates',
          extendDescription:
            'Update pages as business data and progress change.',
        },
        'app-plugin-authorization-example': {
          title: 'Authorization example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-cli-example': {
          title: 'CLI example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-database-example': {
          title: 'Database example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-file-example': {
          title: 'File example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-jobs-example': {
          title: 'Jobs example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-lifecycle-example': {
          title: 'Process example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-mail-example': {
          title: 'Mail example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-notification-example': {
          title: 'Notification example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-office-flows-example': {
          title: 'Office flows example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-queue-example': {
          title: 'Queue example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-realtime-example': {
          title: 'Realtime example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-repository-example': {
          title: 'Repository example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-routes-example': {
          title: 'Routes example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-service-provider-example': {
          title: 'Service provider example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-skills-example': {
          title: 'Skill example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
        'app-plugin-template-print-example': {
          title: 'Template printing example',
          extendTitle: 'Adapt the example for your business',
          extendDescription:
            'Replace sample content, data and permissions with application-owned behavior.',
        },
      },
    },
    currentTitle: 'This application',
    capabilitiesTitle: 'What it provides',
    configurationTitle: 'What to configure and where',
    exampleTitle: 'Use case',
    setupTitle: 'How to integrate and verify',
    agentTab: 'Development request',
    manualTab: 'Configuration steps',
    promptHint:
      'Give this to the Agent developing your application after replacing the placeholders. It is not an instruction for a business chat assistant.',
    promptLabel: 'Editable request',
    copy: 'Copy request',
    copied: 'Copied',
    copyFailed: 'Copy failed. Select and copy the text above manually.',
    exampleHint:
      'This is a learning and adaptation example. The scenario below does not establish that this business is already configured in the application.',
    apiKeys: {
      personalDescription:
        'A personal account entry for creating, rotating and revoking your own keys.',
      applicationDescription:
        'An application-level key management entry in System settings.',
      addTitle: 'Add interfaces with an Agent',
      personalGuideHint:
        'Suggested entry: account menu · Request and setup steps',
      applicationGuideHint:
        'Suggested entry: System settings · Request and setup steps',
      personalTitle: 'My API keys interface',
      applicationTitle: 'Application API keys interface',
      openApplication: 'Manage application API keys',
      setupInterface: 'Add My API keys with an Agent',
      application: {
        setupTitle: 'Add Application API keys with an Agent',
        steps: [
          'Read the installed Skill, current source and API document; look for an existing application API keys page.',
          'Confirm credential ownership, management scope and administrator permissions. Verify the available APIs and implement missing server capabilities before the page.',
          'Add the working page to System settings with the stable route name applicationApiKeysManagement. Register an existing equivalent page instead of duplicating it.',
          'Verify page access and key operations with isolated fixtures, then return the working URL. Do not create real keys or use a placeholder page as evidence of configuration.',
        ],
        prompt:
          'Add an Application API keys management interface to this NocoBase application, under System settings. Reuse and register an equivalent existing page.\n\n1. Read the installed nocobase-app-plugin-api-keys Skill and verify the current source and API document for supported identities, services and authorization. First confirm who owns application credentials, which keys the page manages and which administrators may act. Do not assume it means either all users’ personal keys or an independent application identity.\n\n2. Existing personal endpoints such as GET /api/apiKeys operate only on the signed-in account’s keys; they are not application-wide management APIs. Reuse public services according to the confirmed scope. Explain missing capabilities and implement authorized server APIs before the UI. Never write plugin tables directly, broaden personal endpoint access or invent data.\n\n3. Build the agreed list and management operations using application components and real APIs. Handle loading, empty data, denied access and retry. If creation or rotation is supported, show a full secret once and never log it. Explain and confirm destructive operations.\n\n4. Register the working page in client/routes.ts with required login and administrator access. Use the stable name applicationApiKeysManagement, suggested path /settings/api-keys, and no hardcoded /main prefix; add its System settings entry. Use the stable route name so Features and extensions can discover the page without modifying the foundation plugin. Do not mark a placeholder or manual flag as configured.\n\n5. Verify page access, denied access and key operations with isolated fixtures, including the Features and extensions link. Preserve existing keys and the personal page; do not create real keys in this application. Return the URL, implemented management scope, changes and validation results.',
      },
      checkingAccess: 'Checking access to the management interface…',
      interfaceDenied:
        'The management interface exists, but this account cannot open it. Contact an administrator.',
      openInterface: 'Manage my API keys',
      interfacePromptHint:
        'Copy this request to the development Agent that can edit this application. This page provides instructions; it does not dispatch a task or create credentials.',
      copyInterfacePrompt: 'Copy integration request',
    },
    statusHint:
      'This shows basic plugin configuration. Accounts, channels and business rules still need configuration and verification for the intended scenario.',
    status: {
      loading: 'Checking configuration',
      unknown: 'Configuration could not be confirmed',
      connected: 'Configured',
      partial: 'Configuration incomplete',
      pending: 'Not configured',
    },
    modes: {
      core: 'This is an application core capability. Inspect the application for effective configuration and business usage; this page does not infer its active scope.',
      cli: 'This is a command-line extension. Check command registration in the application terminal; page state does not establish CLI integration.',
      reference:
        'This extension supplies development guidance without runtime registration. Inspect application pages and APIs to determine whether the business feature has been implemented.',
    },
    refresh: 'Refresh configuration status',
    expired: 'Your session expired. Sign in again to inspect configuration.',
    forbidden:
      'This account cannot read configuration status. The guide remains available.',
    failed: 'Could not read configuration status. Try again.',
  },
  entries,
};
