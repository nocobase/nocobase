import type { GuideContent } from './types.js';

// Mockup content. Placeholders are in square brackets and stay in the copied text for the reader to replace.
const enUS: GuideContent = {
  nav: {
    title: 'Features and extensions',
    description:
      'Learn how to use the features available in this application to build your business.',
  },
  page: {
    title: 'Features and extensions',
    description:
      'Explore the features available in this application, with usage instructions, business examples and agent prompts to build your business.',
    search: 'Search names, business terms or scenarios',
    count: '{{shown}} of {{total}} shown',
    noResults: 'No matching capabilities.',
    clear: 'Clear filters',
    columns: {
      index: 'No.',
      name: 'Name',
      source: 'Source',
    },
    empty: {
      title: 'Tell your agent these five things',
      description:
        'Pick a capability on the left. Its prompts already follow these five parts; replace the bracketed text with your own.',
      parts: [
        'Who uses it: which roles, and what each is responsible for.',
        'Business objects: what is managed, such as customers, contracts or purchase requests.',
        'Business rules: numbering, amounts, state changes and other rules that must hold.',
        'Permission boundary: who may view, who may change, and who sees nothing.',
        'Acceptance: how to check the result, such as signing in as two roles and comparing.',
      ],
    },
  },
  sources: {
    all: 'All',
    kernel: 'Core',
    plugin: 'Plugins',
  },
  roles: {
    example: 'Business example',
    skill: 'Skill',
  },
  groups: {
    data: 'Data & files',
    access: 'Identity & access',
    process: 'Processes & execution',
    integration: 'Messages & integrations',
    experience: 'Interface & experience',
    ai: 'AI & knowledge',
    development: 'Development & runtime',
  },
  detail: {
    currentApplication: 'This application',
    dependencyOnly:
      'This package is declared in the application dependencies. No dedicated runtime overview is available here; inspect its integration and business configuration before using it.',
    back: 'Back to the catalog',
    scenarios: 'When to use it',
    prerequisite: 'Before you start',
    defaultPrerequisite: {
      kernel:
        'Already part of this application; nothing to install. Describe your business need to your agent.',
      plugin:
        'This plugin is installed in this application. Describe your business need to your agent.',
      example:
        'This is an example plugin; its data is for demonstration only. To adapt it, ask the agent to build your version in your own plugin, without changing the example plugin.',
      skill:
        'A development Skill the agent reads; it has no page of its own. The agent consults it when you ask for related work.',
    },
    prompts: 'Build with an agent',
    promptHint:
      'Replace the bracketed text with your business; you can edit it right here. Copy takes exactly the text shown.',
    template: 'Template',
    example: 'Filled-in example',
    copy: 'Copy prompt',
    copied: 'Copied. Paste it into your agent conversation.',
    copyFailed: 'Could not copy. Select the text and copy it manually.',
    reset: 'Restore',
    related: 'Related capabilities',
    docs: 'Read the docs',
    demo: 'Open the demo',
    adapt: {
      title: 'Adapt it to your business',
      steps: [
        'Open the demo and walk through it to see what it demonstrates.',
        'Copy the prompt below and replace the bracketed example objects with your own objects and rules.',
        'Ask the agent to build it in your own plugin, leaving the example plugin untouched for later comparison.',
      ],
    },
    covers: 'Core modules covered here',
    reference: 'Developer reference',
    packageName: 'Package',
    skills: 'Skills the agent reads',
    source: 'View the package',
    missing: 'This application does not provide this capability.',
  },
  home: {
    title: 'What this application already provides',
    description:
      'Pick one to see the problem it solves, then hand its prompt to your agent.',
    viewAll: 'Explore all {{count}} features and extensions',
    open: 'View capability',
  },
  unlisted: {
    title: '{{name}}',
    summary:
      'This application depends on this plugin, but the guide has no business description for it yet. Ask your agent to read its documentation and judge what it can solve.',
    scenarios: [
      'Checking whether this plugin helps with a feature you are planning.',
    ],
    prompts: {
      main: {
        label: 'Assess this plugin first',
        template:
          'This application depends on {{name}}. Read its README and Skill first, then tell me what it can solve for [my business need] and what it needs; do not guess from its name.\nOnce confirmed, build it within the agreed scope and explain how to accept it.',
      },
    },
    reference: [
      'Package: {{name}}. The guide has no developer notes for it yet; see the README and skills folder in the package.',
    ],
  },
  entries: {
    'app-plugin-agents': {
      title: 'AI & agents',
      summary:
        'Bring AI assistants into business work to find information, organize it and perform defined tasks.',
      scenarios: [
        'Knowledge questions, customer information and business assistance.',
      ],
      prerequisite:
        'Complete plugin registration and application integration first. Business assistants use model services; Runner tasks depend on the selected tool and its authentication.',
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Add a [business assistant] to [application] to help [users] with [specific task]. It may access only information the user is allowed to see. Specify automatic actions and actions requiring user confirmation, and identify missing information rather than guessing. Provide a conversation entry and verify answers and action boundaries with realistic questions.',
        },
      },
      reference: [
        'Register Agents and configure model services and access.',
        'Integrate OnlineAgent sessions or register a runner for the scenario.',
        'Supply business context and authorized tools, then track runs and usage.',
      ],
    },
    'app-plugin-api-keys': {
      title: 'API keys',
      summary:
        'Allow approved external systems to access the application for a specific user.',
      scenarios: ['System integrations and scheduled synchronization.'],
      prerequisite:
        'Decide which user the external system acts as and which data it actually needs.',
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Provide access-key management for [external system] connecting to [application]. Each key belongs to a specific user and is limited to [purpose]. Let users create and revoke keys and see their purpose. Do not repeatedly expose complete keys in pages or logs. Verify revocation and that access cannot exceed the owning user’s permissions.',
        },
      },
      reference: [
        'Register the server plugin and the API key extensions in authentication configuration.',
        'Create a personal key through the application UI, limiting its scope as needed.',
        'Send x-api-key; requests still follow the owning user permissions.',
      ],
    },
    'app-plugin-authentication': {
      title: 'Authentication',
      summary:
        'Let users sign in with their own identities and manage their sessions.',
      scenarios: ['Application access for employees, customers or partners.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Complete sign-in, sign-out and session-expiry handling for [application], using [existing account method]. Clarify whether self-registration is allowed. Return users to their intended page after sign-in and prevent protected access after sign-out or expiry. Verify successful, failed and expired sessions.',
        },
      },
      reference: [
        'Register authentication and configure the application sign-in methods.',
        'Connect sign-in and session state on the client.',
        'Require authentication on each private API, then enforce business permissions.',
      ],
    },
    'app-plugin-authorization': {
      title: 'Authorization',
      summary: 'Control the pages, actions and data each user can access.',
      scenarios: [
        'Salespeople accessing their customers, managers viewing team data and finance handling selected records.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Configure [sales management] permissions: salespeople view and edit their own customers; managers view team customers; finance sees only [payment information]. Specify pages, actions and record scopes for each role and provide explicit member assignment in administration. Verify page, operation and data access with different roles.',
        },
      },
      reference: [
        'Register the plugin and declare business resources and actions.',
        'Manage permission sets and assignments in application-owned pages.',
        'Enforce authorization in APIs and data access, with matching client visibility.',
      ],
    },
    'app-plugin-authorization-example': {
      title: 'Sales permissions example',
      summary:
        'Explore how roles differ across projects, quotations and orders.',
      scenarios: [
        'Designing responsibility and data access in a sales application.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the sales permissions example to design project, quotation and order access in [my sales app] for [sales, managers and finance]. Define actions and data scopes before building administration and business pages. Keep explicit role assignment and verify sharing and restrictions with different accounts.',
        },
      },
      reference: [
        'Use the Examples registration of Authorization and the optional rule plugins.',
        'Apply the example migrations and seeds in an example database.',
        'Open the guide and compare access with the documented example identities.',
      ],
    },
    'app-plugin-authz-default-access': {
      title: 'Authorization: default record access',
      summary:
        'Set a shared baseline of visible records for people who already have the relevant permissions.',
      scenarios: [
        'Public customers or shared resources visible to team members.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'In [customer management], let [team members] who already have view permission see [public customers] by default. Define public records and restricted fields. Do not add edit or delete permissions, and verify people without view permission still cannot see these records.',
        },
      },
      reference: [
        'Register the Client and Server plugins with Authorization.',
        'Add the defaultAccess() factory to the authorization configuration.',
        'Configure resource actions and their record selections in the authorization settings.',
      ],
    },
    'app-plugin-authz-restriction-rules': {
      title: 'Authorization: restriction rules',
      summary:
        'Further narrow selected users’ data access to protect sensitive records.',
      scenarios: [
        'Temporary collaborators limited to selected projects or restricted customer records.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Limit [specified people] in [application] to [allowed records]. Explain the combined effect of existing roles and sharing rules and make restrictions visible in administration. Verify allowed records remain accessible and records outside the scope are blocked even if previously shared.',
        },
      },
      reference: [
        'Register the Client and Server plugins with Authorization.',
        'Add the restrictionRules() factory to the authorization configuration.',
        'Define the records that remain allowed and verify the combined permission result.',
      ],
    },
    'app-plugin-authz-sharing-rules': {
      title: 'Authorization: sharing rules',
      summary:
        'Share selected business records with collaborators across teams.',
      scenarios: [
        'Customer collaboration, project support and order handovers.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Add sharing rules for [customers or projects], sharing [matching records] with [specified collaborators]. Define the scope and how sharing is removed while respecting recipients’ existing action permissions. Verify visibility before, during and after sharing.',
        },
      },
      reference: [
        'Register the Client and Server plugins with Authorization.',
        'Add the sharingRules() factory to the authorization configuration.',
        'Select recipients, resource actions and records; test with a recipient account.',
      ],
    },
    'app-plugin-cli-example': {
      title: 'Maintenance tool example',
      summary:
        'Show how an Agent can create maintenance commands for repetitive work.',
      scenarios: ['Operator-run data checks or report generation.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the command extension example to add an operator-run [data check] tool to [application]. Define inputs, scope and results; inspect without modifying by default. Explain success and failure clearly and provide usage steps and a test result.',
        },
      },
      reference: [
        'Register the CLI entry in cli/plugins.ts.',
        'Run pnpm nocobase cli-example --help from the application.',
        'Try greet world --json and inspect the command implementation and tests.',
      ],
    },
    'app-plugin-concurrency': {
      title: 'Concurrency',
      summary:
        'Configure concurrency control to prevent conflicts from duplicate submissions or simultaneous operations.',
      scenarios: [
        'Repeated handling of the same order or users competing for one resource.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Coordinate [order processing] so concurrent handling of [the same order] does not conflict. Check the coverage of the current deployment and explain whether it supports multiple running application instances. Provide waiting or conflict feedback and verify processing can resume after errors.',
        },
      },
      reference: [
        'Register the Server plugin before the business plugins that consume it.',
        'Compose defineConcurrencyConfig() under the concurrency configuration key.',
        'Use ConcurrentManager from @nocobase/concurrency to create resource locks or synchronizers, configure waiting and timeouts, and ensure release.',
        'Resolve the concurrency service; the built-in mutex coordinates only one process.',
      ],
    },
    'app-plugin-database-example': {
      title: 'Data setup example',
      summary:
        'Use an example to prepare data structures and initial content for a new business feature.',
      scenarios: ['Preparing consistent data for a new module.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the data extension example to prepare fields, relationships and initial settings for [new module]. Separate required setup from demonstration data and preserve existing records. Verify a new environment works and an existing environment retains its data after updating.',
        },
      },
      reference: [
        'Inspect the plugin migration, seed and Server declaration.',
        'Register its Server entry in an example application.',
        'Run the normal database apply workflow and inspect the contributed schema and data.',
      ],
    },
    'app-plugin-database-explorer': {
      title: 'Database explorer',
      summary:
        'Help administrators understand what business information the application stores and how it is organized.',
      scenarios: [
        'Review existing data before planning new pages and features.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Provide [administrators] a read-only view of business data structures, fields and relationships with understandable labels. Do not offer data or structure modification. Verify ordinary users cannot enter, then identify which existing data [new feature] can reuse.',
        },
      },
      reference: [
        'Register Authentication, Authorization and this plugin on Client and Server.',
        'Grant page:database-explorer/access to the intended administrators.',
        'Build the application view with DatabaseExplorerClient; this package supplies no standalone page.',
      ],
    },
    'app-plugin-file': {
      title: 'Files & attachments',
      summary:
        'Attach files to business records with upload, preview, download and access controls.',
      scenarios: [
        'Signed contracts and quotations kept with the business record they belong to.',
        'Receipt photos on an expense claim, previewed by finance during review.',
        'One ID photo or avatar on an employee profile.',
      ],
      prerequisite:
        'The file plugin is part of this application. Files are stored on the server by default; to use object storage instead, prepare a bucket and its access credentials for your operator to configure.',
      prompts: {
        attachments: {
          label: 'Attachments on a record',
          template:
            'Add attachments to [business record].\nWho uses it: [owner] uploads and deletes; [participants] view and download.\nBusiness rules: each record accepts several [file types], up to [size] each, with preview, download and delete.\nPermission boundary: people without access to the record can neither see nor download its attachments.\nAcceptance: a failed upload keeps the form and allows a retry; verify permissions with different roles and confirm each attachment stays on its own record.',
          example:
            'Add attachments to contracts.\nWho uses it: the contract owner uploads and deletes; participants view and download.\nBusiness rules: each contract accepts several PDFs or images, up to 20 MB each, with preview, download and delete.\nPermission boundary: people without access to the contract can neither see nor download its attachments.\nAcceptance: a failed upload keeps the form and allows a retry; verify with the owner, a participant and an unrelated colleague, and confirm each attachment stays on its own contract.',
        },
        single: {
          label: 'One image field',
          template:
            'Add one [image name] to [business record].\nWho uses it: [who uploads and replaces it].\nBusiness rules: accept only [image formats], up to [size]; a replaced image is no longer shown.\nPermission boundary: [who may see the image].\nAcceptance: lists and details show a thumbnail; replacing or deleting it updates both.',
          example:
            'Add one ID photo to employee profiles.\nWho uses it: HR uploads and replaces it; employees can only view their own.\nBusiness rules: accept only JPG and PNG, up to 5 MB; a replaced photo is no longer shown.\nPermission boundary: colleagues in the same department and HR may see it; nobody else.\nAcceptance: the employee list and detail show a thumbnail; replacing or deleting it updates both.',
        },
      },
      reference: [
        'Register Server and Client entries; configure Database and Drive.',
        'Declare a business file collection and expose authorized operations with defineFileRepositoryApiRoutes.',
        'Install file-component-ui and connect upload, list and preview components.',
      ],
    },
    'app-plugin-file-example': {
      title: 'File attachments example',
      summary:
        'Try employee photos and order attachments to see how files fit different business records.',
      scenarios: ['Adding file operations to employee or order pages.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the attachment example to add one profile photo to [employee records] and multiple attachments to [orders]. Support replacement, upload and viewing with defined file types and size limits. Restrict permissions and verify record consistency after replacing or deleting files.',
        },
      },
      reference: [
        'Register File and the example on Client and Server, then apply their migrations.',
        'Open the attachment repository, employee avatar or order attachment page.',
        'Upload a sample file and inspect how the business record links to its file record.',
      ],
    },
    'app-plugin-foundation': {
      title: 'Features and extensions',
      summary:
        'Explore available features, their use cases and how to turn business requirements into working features with an agent.',
      scenarios: [
        'Understand what the application offers, choose reusable capabilities and describe the business requirements to an agent.',
      ],
      prerequisite:
        'After signing in, open Features and extensions at the bottom of the sidebar.',
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use Features and extensions in [current application] to select reusable capabilities for [planned feature]. Explain the problem each capability solves, its use cases and prerequisites, then turn these into business requirements an agent can implement. Distinguish available capabilities from completed business features; installing a plugin alone does not mean a feature is complete.',
        },
      },
      reference: [
        'Register the Client and Server plugins with Authentication and Authorization.',
        'Generate the catalog from the application manifest and present business descriptions, use cases and agent prompts.',
        'The runtime usage page still requires unrestricted administrator access; catalog dependencies do not prove business integration.',
      ],
    },
    'app-plugin-i18n': {
      title: 'Language switching',
      summary:
        'Let users switch the application language and retain their preference.',
      scenarios: [
        'Chinese- and English-speaking teams using the same application.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Add a [Chinese, English] language selector to [application], defaulting to [Chinese] and retaining each user’s preference. Update menus, forms and feedback together and preserve the choice on refresh. Verify the first visit and signing in again.',
        },
      },
      reference: [
        'Register the Client and Server plugins.',
        'Declare locale loaders in the application and configure its default locale.',
        'Connect the language picker to the plugin hooks and verify translated resources.',
      ],
    },
    'app-plugin-jobs-example': {
      title: 'Jobs and schedules example',
      summary:
        'Try task submission, progress and recurring execution before adapting them to business work.',
      scenarios: ['Bulk exports or daily data preparation.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the background jobs example to build [bulk export] and [daily preparation] in [application]. Provide task lists, progress, results, failure details, safe retries and recurring-task controls. Verify results remain accessible after leaving the page and repeated operations do not repeat business effects.',
        },
      },
      reference: [
        'Use the registered example with the application Jobs service configured.',
        'Open One-off jobs to submit sample work and inspect its progress.',
        'Open Schedules to start or stop the predefined recurring rules.',
      ],
    },
    'app-plugin-knowledge': {
      title: 'Knowledge management',
      summary:
        'Organize knowledge so teams can find and use information within their permissions.',
      scenarios: [
        'Employee handbooks, product information, procedures and project documents.',
      ],
      prerequisite:
        'Gather the documents first and decide who may read which parts.',
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Build [team knowledge base] organized by [department or topic], with navigation, search and reading. Define who may read, edit and manage each area. Make common answers easy to find and verify search and content access with authorized and unauthorized accounts.',
        },
      },
      reference: [
        'Register Knowledge and define application spaces and access policies.',
        'Compose KnowledgeView and document features in application pages.',
        'Connect search providers and agent retrieval as needed while preserving user access rules.',
      ],
    },
    'app-plugin-lifecycle-example': {
      title: 'Business process examples',
      summary:
        'Use ticket, expense and order examples to organize business states and processing.',
      scenarios: [
        'Moving an offline ticket, expense or purchase request into the application, after first seeing how states change.',
        'Walking through a complete process in the example before deciding who handles which step.',
      ],
      prerequisite:
        'This is an example plugin; its data is for demonstration only. To adapt it, ask the agent to build your version in your own plugin following the example, without changing the example plugin.',
      prompts: {
        adapt: {
          label: 'Adapt to my process',
          template:
            'Following the business process example (tickets), build [offline process name] in this application, in my own plugin, without changing the example plugin.\nWho uses it: [requesters] submit, [handlers] process, [managers] view everything.\nStates: [draft → in review → approved / returned → closed]; say who handles each step and what must be true to move on.\nBusiness rules: [for example, amounts above a limit need a second review; a return needs a reason].\nPermission boundary: requesters see only their own requests; handlers process only what is assigned to them.\nAcceptance: complete one real run; then verify returns, withdrawals and unauthorized actions are blocked and the history is complete.',
          example:
            'Following the business process example (tickets), build purchase requests in this application, in my own plugin, without changing the example plugin.\nWho uses it: employees submit purchase requests, department managers review, buyers place orders, finance views everything.\nStates: draft → manager review → awaiting purchase → ordered → closed; managers can return a request to draft.\nBusiness rules: requests above 50,000 also need a finance review; a return needs a reason; the amount cannot change once ordered.\nPermission boundary: employees see only their own requests; managers review only their department; buyers handle only approved requests.\nAcceptance: complete one real request; then verify returns, withdrawals, the extra finance review and unauthorized actions are blocked and the history is complete.',
        },
        review: {
          label: 'Explain the example first',
          template:
            'Open the business process example first and explain which states, roles and actions it demonstrates, which parts can be reused for [my process] as they are, and which need changing for my business.\nDo not write code yet; list the [business rules and permissions] you need me to confirm.',
          example:
            'Open the business process example first and explain which states, roles and actions it demonstrates, which parts can be reused for our expense claims as they are, and which need changing for our business.\nDo not write code yet; list the approval levels, amount rules and finance permissions you need me to confirm.',
        },
      },
      reference: [
        'Use the registered example with its migrations and seeds.',
        'Open a workflow example and perform its documented business actions.',
        'Inspect state changes, history and effects alongside the lifecycle source.',
      ],
    },
    'app-plugin-mail': {
      title: 'User mailboxes',
      summary:
        'Connect email accounts, sending, receiving and synchronization to business work.',
      scenarios: [
        'Customer follow-up, quotations and business correspondence.',
      ],
      prerequisite:
        'Needs a mailbox account you may authorize; verify with a test mailbox before connecting a real one.',
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Connect [authorized mailbox] to [customer management]. Provide reading, composing and sending with clear send or sync failures. Define how messages relate to customers and restrict mailbox use to authorized people. Verify with a test mailbox and test recipients before real business use.',
        },
      },
      reference: [
        'Register Mail and add mailConfig to application configuration.',
        'Configure providers and let users authorize their mailboxes.',
        'Integrate inbox, composition, sending and sync through mail services and components.',
      ],
    },
    'app-plugin-mail-example': {
      title: 'Offline mail example',
      summary:
        'Explore mail management with simulated mailboxes before connecting a real account.',
      scenarios: ['Validating email workflows before business integration.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Demonstrate [team mailbox] account management, sync, composing, templates and signatures with the mail example. Keep delivery simulated and send nothing to real recipients. Identify reusable pages and features and the prerequisites for connecting [my mail service].',
        },
      },
      reference: [
        'Use the three mock provider configurations included in Examples.',
        'Open Mail example to initialize and synchronize its sample mailboxes.',
        'Try composing, templates, signatures and sync logs; delivery stays simulated.',
      ],
    },
    'app-plugin-notification': {
      title: 'System notifications',
      summary:
        'Notify the right people when business events need their attention.',
      scenarios: ['Task assignments, status changes and work reminders.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'In [task management], notify [relevant people] when a task is assigned or its status changes to [specified state]. Explain the event and link to the task. Define delivery channels, avoid duplicate alerts for the same event, handle failures and verify recipients and access scope.',
        },
      },
      reference: [
        'Register Notification and the required channel providers.',
        'Configure named channels and prepare channel-specific messages.',
        'Send through the notification service with an idempotency key and inspect delivery results.',
      ],
    },
    'app-plugin-notification-example': {
      title: 'Task notification example',
      summary: 'See how task assignment triggers a personal notification.',
      scenarios: ['Adding reminders to task or support-ticket applications.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the task notification example to notify [assigned handlers] when [tickets] are assigned or updated. Include a summary and a link to the ticket. Test assignment and a status update with two accounts, verifying correct recipients and ticket access.',
        },
      },
      reference: [
        'Use the registered notification runtime and in-app channel.',
        'Create a sample task and assign it to an application user.',
        'Open its notification as the recipient and inspect task updates.',
      ],
    },
    'app-plugin-notification-in-app': {
      title: 'Notification: in-app messages',
      summary:
        'Collect personal notifications inside the application for convenient review.',
      scenarios: [
        'Task reminders, status changes and personal business updates.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Add a personal inbox to [application] for [task assignments and status changes]. Show unread status, allow marking messages read and link to related records. Users may see only their own messages. Verify empty states, inaccessible linked records and switching accounts.',
        },
      },
      reference: [
        'Register the Server plugin after the notification runtime for message delivery.',
        'Configure a named channel with type: in-app.',
        'Integrate the authenticated inbox APIs or UI; its Client page is for development.',
      ],
    },
    'app-plugin-notification-providers': {
      title: 'Notification: built-in channels',
      summary:
        'Deliver business notifications through email, Feishu or DingTalk.',
      scenarios: [
        'Important reminders that should reach people outside the application.',
      ],
      prerequisite:
        "Before sending to email, Feishu or DingTalk, prepare that channel's account or bot credentials.",
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Send [business notifications] through [email, Feishu or DingTalk]. Check existing channels and recipient settings and identify missing connection information. Provide channel management and delivery results. Verify formatting and delivery with test recipients before connecting real business events.',
        },
      },
      reference: [
        'Register this Server plugin after the notification runtime.',
        'Configure named channels and their required mailers or provider credentials.',
        'Send through the notification service and inspect delivery results.',
      ],
    },
    'app-plugin-office-flows-example': {
      title: 'Office process examples',
      summary:
        'Use data requests, incoming documents and office tasks to organize collaboration.',
      scenarios: [
        'Department coordination, information requests and related tasks.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the office process example to build [data-use requests]. Requesters provide purpose and scope; [designated people] handle requests and create related collaboration tasks when needed. Provide My requests, My work and history and verify linked task and request states stay consistent.',
        },
      },
      reference: [
        'Use the example migrations, seeds and office configuration.',
        'Open Data requests or Incoming documents to start a sample process.',
        'Follow related work in My tasks and inspect the record lifecycles.',
      ],
    },
    'app-plugin-queue-example': {
      title: 'Queued work example',
      summary:
        'Use an example to process batches of work item by item in the background.',
      scenarios: ['Digest generation, messages and order follow-up.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the queue example to process [batch business work] item by item. Show submission and processing results and define retry and duplicate handling. Verify all-success, partial-failure and resubmission with test data and provide an entry point or usage instructions.',
        },
      },
      reference: [
        'Register the Server plugin and configure an application queue backend.',
        'Inspect its queue handlers and the authenticated API in the API document.',
        'Publish sample work through the documented API and inspect processing results.',
      ],
    },
    'app-plugin-realtime-example': {
      title: 'Realtime business examples',
      summary:
        'Try live task collaboration, personal notifications and export progress.',
      scenarios: ['Adding automatic updates to business pages.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the realtime business example to update [team tasks] automatically. Changes by one person should reach other authorized users, while personal messages remain private. Test with two accounts, disconnect and reconnect, and confirm the latest data is restored.',
        },
      },
      reference: [
        'Use the registered Client and Server example with Realtime enabled.',
        'Open Tasks, Inbox or Exports and compare updates in two sessions.',
        'Use the capability lab to inspect subscriptions, snapshots and recovery.',
      ],
    },
    'app-plugin-repository-example': {
      title: 'Business data examples',
      summary:
        'Use customer, order and reporting examples to build connected business pages.',
      scenarios: ['Customer contacts, order items and sales summaries.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the business data examples to build [customers, contacts, orders and line items]. Support related views, filters and sales summaries and keep related information consistent within each submission. Verify totals, relationship changes and role-specific data scopes.',
        },
      },
      reference: [
        'Use the example registration and apply its migrations and sample seeds.',
        'Open CRM, Orders or a focused Repository example.',
        'Compare page operations with the declared resources and API implementations.',
      ],
    },
    'app-plugin-routes-example': {
      title: 'Page integration example',
      summary:
        'Use an example to add a business page with real data to the application.',
      scenarios: ['A new business entry point or small feature page.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the page integration example to add [business page] and navigation to [application]. Display [required information] with loading, empty and failure states. Limit access to [specified roles] and verify refresh and direct links work.',
        },
      },
      reference: [
        'Register the Server and Client entries with Authentication.',
        'Open the example page and inspect its API result.',
        'Compare the route declarations, React provider and lazy page implementation.',
      ],
    },
    'app-plugin-scheduler': {
      title: 'Scheduling',
      summary: 'Run recurring work at specified times and inspect each result.',
      scenarios: [
        'Daily customer synchronization, weekly summaries and scheduled reminders.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Create a recurring [daily customer sync] in [application], running at [time] in [timezone]. Provide a task list, enable/disable controls and execution history with results and failure reasons. Define repeat and catch-up behavior. Test one run and verify the next scheduled time.',
        },
      },
      reference: [
        'Register Scheduler and compose the application jobs service.',
        'Register a target type, then declare cron and timezone with defineSchedule.',
        'Configure a suitable Jobs backend and inspect occurrence results.',
      ],
    },
    'app-plugin-service-provider-example': {
      title: 'Background service example',
      summary:
        'Use a service-status example to understand ongoing background work.',
      scenarios: [
        'Business capabilities that need a continuously running service.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the service example to plan operation and status checks for [ongoing business work]. Define startup, shutdown and error recovery and restrict access to status information. Verify with simulated work first, then identify prerequisites for real integration.',
        },
      },
      reference: [
        'Register the Server plugin in an example application.',
        'Inspect its token, service and provider implementations.',
        'Read the documented status API after startup; add authentication to sensitive business APIs.',
      ],
    },
    'app-plugin-skills-example': {
      title: 'Agent guidance example',
      summary:
        'Show how reusable capability guidance helps an Agent build consistently.',
      scenarios: [
        'Repeated reuse of existing components and business capabilities.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the capability-guidance example to document [existing team feature] for an Agent. Explain suitable scenarios, required business information, reusable entry points and verification. Have the Agent build a [business notice] example from the guidance and identify missing or ambiguous instructions.',
        },
      },
      reference: [
        'Register the Server entry and synchronize the application Skills.',
        'Read the package Skill and import the public AppNotice component.',
        'Compose the component in an application page using the authenticated notice API.',
      ],
    },
    'app-plugin-template-print': {
      title: 'Template printing Skill',
      summary:
        'Give the Agent guidance for building documents that follow business templates.',
      scenarios: [
        'Contracts, quotations and invoices with a prescribed layout.',
      ],
      prerequisite:
        'A development Skill the agent reads; it has no page of its own. Prepare an Office template; PDF output needs a converter on the server.',
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the template-printing guidance to build document generation for [quotations] from [my template]. Fill customer details, line items, amounts and dates and allow Word downloads; offer PDF only after checking environment support. Restrict generation to authorized users and verify pagination, amounts and missing data.',
        },
      },
      reference: [
        'Keep this package as a direct development dependency.',
        'Run pnpm nocobase skills sync from the application.',
        'Follow the Skill to implement printing; use the separate example to try DOCX and PDF output.',
      ],
    },
    'app-plugin-template-print-example': {
      title: 'Template printing example',
      summary:
        'Try filling a document template with sales data and downloading the result.',
      scenarios: ['Verifying quotation or invoice printing workflows.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Use the printing example to generate downloadable Word documents for [my sales records] using [specified template] and authorized data. Verify customer details, line items, amounts and pagination. Enable PDF only after confirming conversion support and explain permission or missing-data failures.',
        },
      },
      reference: [
        'Use the registered example with its migrations, seeds and Sales Quotes permissions.',
        'Open Template printing and download a sample invoice as DOCX.',
        'Install LibreOffice on the server to try PDF conversion.',
      ],
    },
    'app-plugin-users': {
      title: 'User administration',
      summary: 'Manage application members, account status and assigned roles.',
      scenarios: [
        'Onboarding, departures, team changes and responsibility updates.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Provide member management for [application]. Administrators can add members, assign [roles] and deactivate departing users. Assign roles only to explicitly selected people and make assignments visible and editable. Verify ordinary members cannot administer other accounts and deactivated accounts cannot sign in.',
        },
      },
      reference: [
        'Register Users after Authentication and Authorization.',
        'Grant administrators the required user actions.',
        'Build application-owned pages with UsersClient and optional role scopes.',
      ],
    },
    db: {
      title: 'Database',
      summary:
        'Connect databases and inspect configured connections, tables and fields.',
      scenarios: [
        'Customers, contacts and follow-ups that are maintained for years and linked to each other.',
        'Orders saved together with their lines, where totals must always add up.',
        'Moving data out of an old spreadsheet, removing duplicates and checking required fields.',
      ],
      prerequisite:
        'Already part of this application; nothing to install. Before asking, decide which business objects you have, how they relate, and who may view or change them.',
      prompts: {
        records: {
          label: 'Build data management',
          template:
            'Build data management for [business name] in this application.\nWho uses it: [which roles and what each is responsible for].\nBusiness objects: [object A, object B, object C]; relationship: [one object A has many object B]; required information: [...].\nBusiness rules: [for example, numbers are unique; object A cannot be deleted while it has unfinished object B].\nPermission boundary: [who may create and edit, who may only view the records they own].\nAcceptance: provide lists, search, filters, create, edit and detail views; sign in with different roles to verify what each can see, and confirm duplicates are rejected and related records and totals are correct.',
          example:
            'Build data management for customer follow-up in this application.\nWho uses it: salespeople maintain their own customers; sales managers view every customer in their team.\nBusiness objects: customers, contacts and follow-ups; one customer has many contacts and many follow-ups; customer name and owner are required.\nBusiness rules: two customers cannot have the same name; a customer with an open follow-up cannot be deleted.\nPermission boundary: salespeople create and edit only customers they own; managers view all and can change the owner.\nAcceptance: provide lists, search, filters, create, edit and detail views; sign in as a salesperson and a manager to verify what each can see, and confirm duplicate customers are rejected and each customer shows the right contacts and follow-ups.',
        },
        import: {
          label: 'Import existing data',
          template:
            'Import [business object] from [an old spreadsheet or system] into this application.\nWho uses it: [the person importing] imports; [other roles] maintain the records in the application afterwards.\nBusiness rules: remove duplicates by [unique field]; rows missing [required information] are skipped and listed with the reason.\nPermission boundary: only [role] may import; imported records follow the existing permissions.\nAcceptance: try a [10-row] sample first and report the result, then import everything; importing the same file twice creates no duplicates.',
          example:
            "Import the purchasing team's supplier spreadsheet into this application.\nWho uses it: the purchasing coordinator imports; buyers maintain suppliers in the application afterwards.\nBusiness rules: remove duplicates by tax registration number; rows missing the supplier name or contact phone are skipped and listed with the reason.\nPermission boundary: only the purchasing coordinator may import; imported suppliers are visible to every buyer.\nAcceptance: try a 10-row sample first and report the result, then import everything; importing the same file twice creates no duplicate suppliers.",
        },
      },
      reference: [
        'Configure a database connection in the application.',
        'Define tables and relations in migrations, then generate Collection types.',
        'Resolve repositories from the application database service for queries and transactions.',
      ],
    },
    i18n: {
      title: 'Multilingual content',
      summary:
        'Make pages, form guidance and operation results understandable across languages.',
      scenarios: [
        'Teams in different regions sharing customer, order or employee applications.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Add [Chinese and English] interface content to [business]. Cover menus, field labels, validation, empty states and operation results with consistent business terminology. Check long text and missing translations. Do not automatically rewrite user-entered business content.',
        },
      },
      reference: [
        'Provide language resources under a namespace.',
        'Register resources through application or plugin declarations.',
        'Use translation bindings; the i18n plugin supplies language switching.',
      ],
    },
    jobs: {
      title: 'Background jobs',
      summary:
        'Run lengthy work in the background while users continue other tasks.',
      scenarios: [
        'Bulk exports, data preparation or external synchronization.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Add a background [bulk export] task to [business]. Show a task record immediately, with progress, results and failure reasons available after leaving the page. Define safe retries and prevent duplicate business results from repeated clicks. Restrict result access and downloads to authorized users.',
        },
      },
      reference: [
        'Resolve a scoped executor from the application jobs service.',
        'Register job classes or recurring rules and set up the executor.',
        'Submit work with retry and idempotency handling; choose a suitable backend for multiple instances.',
      ],
    },
    lifecycle: {
      title: 'Business processes',
      summary:
        'Define business record states, transition rules and follow-up actions, and keep a history of the process.',
      scenarios: [
        'Support tickets, expenses, purchase requests and order fulfillment.',
      ],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Create a [draft, pending, completed, closed] process for [business record]. Define who handles each state, allowed actions and conditions for the next step. Provide process guidance, work queues and history. Verify that unauthorized actions and invalid state changes are blocked.',
        },
      },
      reference: [
        'Declare states and transitions with defineLifecycle.',
        'Configure a repository store and an effect dispatcher.',
        'Fire transitions from authorized APIs and display state and history.',
      ],
    },
    queue: {
      title: 'Queued work',
      summary:
        'Process bursts of work in a queue without keeping users waiting.',
      scenarios: ['Order follow-up, bulk messages and data synchronization.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Queue [follow-up work] in [business]. Define when it is queued, the successful outcome and how failures are retried or handled manually. Receiving the same work twice must not duplicate business effects. Provide a way to inspect processing status.',
        },
      },
      reference: [
        'Use the application-configured QueueService.',
        'Register channel handlers, then publish JSON messages.',
        'Choose an appropriate backend and design failure handling.',
      ],
    },
    realtime: {
      title: 'Live updates',
      summary: 'Keep pages up to date as business information changes.',
      scenarios: ['Collaborative tasks, notifications and export progress.'],
      prompts: {
        main: {
          label: 'Ask the agent',
          template:
            'Update [business page] when other users change records. Show only changes the current user may access. Indicate disconnection and recover the latest data after reconnecting. Verify updates, access isolation and recovery with two accounts.',
        },
      },
      reference: [
        'Declare topics and subscription permissions.',
        'Publish events after business state changes.',
        'Subscribe and refetch data; resynchronize authoritative state after reconnecting.',
      ],
    },
  },
};

export default enUS;
