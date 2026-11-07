import type { GuideContent } from './types.js';

const enUS: GuideContent = {
  nav: {
    title: 'Capability guide',
    description:
      'What the built-in capabilities solve, and how to ask your agent for them.',
  },
  page: {
    title: 'Capability guide',
    description:
      'These capabilities are built into NocoBase, and your agent uses them directly instead of building them from scratch. Find one close to your business, copy its prompt, adapt it to your situation, and give it to your agent.',
    requestTitle: 'A good request has four parts',
    requestHint:
      'Write these four points in plain words; no technical knowledge needed. Every prompt in this guide follows this shape.',
    requestParts: [
      {
        title: 'Who uses it',
        example: 'Applicants, reviewers, administrators',
      },
      {
        title: 'What it records',
        example: 'Order number, item, amount, status',
      },
      {
        title: 'What the rules are',
        example:
          'Applicants see only their own orders; a rejection needs a reason',
      },
      {
        title: 'When it is done',
        example:
          'After a decision, the applicant gets a message linking to the order',
      },
    ],
    search:
      'Search capabilities or problems, such as "attachment" or "reminder"',
    all: 'All',
    noResults: 'No capability matches. Try other words.',
    clear: 'Clear search',
    count: '{{count}} capabilities',
  },
  groups: {
    access: {
      title: 'People and access',
      description: 'Who can sign in, and who can see and do what.',
    },
    data: {
      title: 'Data and files',
      description:
        'Where data lives, and how attachments and printed documents work.',
    },
    process: {
      title: 'Processes and tasks',
      description:
        'Move records through stages, and show everyone what to do next.',
    },
    messages: {
      title: 'Messages and reminders',
      description: 'Tell the right people at the right time.',
    },
    experience: {
      title: 'Look and language',
      description: "The application's appearance and languages.",
    },
    ai: {
      title: 'AI',
      description: 'Add AI assistants and company knowledge to business pages.',
    },
  },
  prerequisites: {
    builtIn: 'Built in',
    config: 'Needs configuration',
    plugin: 'Needs a plugin',
    agentBuilt: 'Built by your agent',
    commercial: 'Commercial plugin',
  },
  detail: {
    back: 'Back to the capability guide',
    scenarios: 'Typical situations',
    prompts: 'Prompts',
    promptHint:
      'Adapt it to your business before copying, then paste it into Claude Code, Codex, Cursor, or any coding agent opened in this project. Edits are not saved.',
    copy: 'Copy prompt',
    copied: 'Copied',
    copyFailed: 'Unable to copy. Select the text and copy it manually.',
    reset: 'Restore default',
    prerequisite: 'Before you start',
    related: 'Often used together',
    docs: 'Read the documentation',
    demo: 'See a demo',
    demoHint: 'The demo page is in the Examples template.',
    reference: 'Developer reference',
    packages: 'Packages',
    skills: 'Skills your agent reads',
    applicationOwned: 'Built by the application itself; no separate package.',
    missing: 'This capability does not exist.',
  },
  home: {
    title: 'Built-in capabilities',
    description:
      'Your agent uses these directly instead of building them from scratch. Open one to see what it solves and get a prompt you can edit and copy.',
    viewAll: 'View all {{count}} capabilities',
    open: 'View prompts',
  },
  capabilities: {
    auth: {
      title: 'Authentication',
      summary:
        'Sign-in, registration, password reset, company single sign-on, and API keys.',
      scenarios: [
        'The app is for employees only; administrators create accounts and sign-up is closed.',
        'Employees sign in with the company identity platform (OIDC, SAML).',
        'Other systems call the application with API keys.',
      ],
      prerequisite:
        'Built in. Company sign-in needs details from your identity platform administrator and a registered callback URL.',
      prompts: {
        disableSignUp: {
          label: 'Close sign-up',
          text: 'This application is for company employees only. Administrators create all accounts.\nDisable self-registration and remove the registration link from the sign-in page.\nExisting employees must still be able to sign in with their accounts and passwords.\nKeep the forgot-password link.',
        },
        companySso: {
          label: 'Company SSO',
          text: "Let employees sign in with our company identity platform using OIDC.\n\nKeep account-password sign-in and add a Company account button.\nThe button opens the company identity platform. After successful sign-in, return to the application's home page.\n\nAllow first sign-in to create an application account, identified by the platform's stable user identifier.\nDo not automatically link accounts by matching names or emails. New accounts use the application's default permissions.\n\nList the information the identity platform administrator must provide and the callback URL they need to register.",
        },
        apiKeys: {
          label: 'API keys',
          text: "Add an Integration keys entry to the user menu, using the application's built-in API keys capability.\nEmployees manage only the keys they created, entering a purpose and a validity period in days.\nShow the full key only once after creation, with a prompt to copy and store it right away.\nList each key's name, an identifiable fragment, status, expiry, and last use, and allow revoking it after confirmation.\nNever show the full key in the list, logs, or details.",
        },
      },
    },
    authorization: {
      title: 'Permissions',
      summary:
        'Control who can open which pages, run which actions, and see which records.',
      scenarios: [
        'Applicants see their own orders; reviewers see every pending order.',
        'Grant access by job, and let administrators adjust it later.',
        'Someone helping out temporarily sees only records below an amount.',
      ],
      prerequisite: 'Built in; nothing to prepare.',
      prompts: {
        jobs: {
          label: 'Jobs',
          text: "Create Purchase requester and Order reviewer jobs for the application.\nPurchase requesters can enter the orders page and view orders they requested.\nOrder reviewers can enter the orders page, view orders, and approve or reject pending orders.\nOnly application administrators can change permissions and assignments.\nUse the application's existing authorization capability so administrators can adjust permissions and assign people later.",
        },
        dataScopes: {
          label: 'Data scopes',
          text: "Let purchase requesters view only their own orders, using the order's requester field to determine ownership.\nOrder reviewers can view all orders and process pending approvals.\nAdministrators can adjust each job's order-viewing scope in its permission set.",
        },
        restrictions: {
          label: 'Restrictions',
          text: 'Bob is temporarily helping review purchase orders and may view only orders of 2,000 or less.\nAdd an amount limit to his View orders action, keeping his existing job and data scopes.\nApply the limit to his own orders and to orders shared with him.\nAdministrators can change the amount or remove the rule; before removal, explain that his visible scope may grow.',
        },
      },
    },
    dataSources: {
      title: 'Data sources',
      summary:
        'Choose the application database and use business data from existing external databases.',
      scenarios: [
        'Move from SQLite to PostgreSQL or MySQL before going live.',
        'Show settlement data from the finance system in supplier details.',
      ],
      prerequisite:
        'SQLite by default. Another database needs its driver; an external database needs its connection details.',
      prompts: {
        postgres: {
          label: 'Switch database',
          text: "Switch the application database from SQLite to PostgreSQL.\nRead the connection details from the server's runtime configuration, not from source code.\nExplain which database driver to install and which settings to fill in, and remind me that existing data is not migrated automatically.",
        },
        externalDatabase: {
          label: 'External database',
          text: "Connect the company's existing finance database as a read-only external data source; do not modify its tables.\nMatch records by supplier number and add a Settlement section to supplier details showing the settlement cycle, credit limit, and settlement status, labeled with its source.\nKeep reading supplier contact details from the application database, and read settlement data directly from the external database without importing it.\nRead the connection credentials from the server's runtime configuration.",
        },
      },
    },
    file: {
      title: 'Files',
      summary:
        'Upload files, attach them to records, and preview or download them.',
      scenarios: [
        'Attach quotes, contracts, and delivery receipts to purchase orders.',
        'Upload an avatar to each employee profile.',
      ],
      prerequisite:
        'Built in, storing files locally. Object storage needs a bucket and access keys from your provider.',
      prompts: {
        attachments: {
          label: 'Attachments',
          text: 'Add purchase attachments to my existing order management application.\n\nAdd an attachment area to order details. Each order can have multiple files, including PDF, images, and DOCX.\nShow filenames and sizes, with actions to preview, download, and remove attachments.\nAfter uploading, let users save the attachments to the current order. Keep them available when the order is reopened.\nAnyone with access to an order can view and download its attachments. Applicants and reviewers can add or remove attachments.\nRemoving an attachment only unlinks it from the current order; retain the file.',
        },
        avatar: {
          label: 'Avatar',
          text: 'Add an avatar to each employee, with one image per employee.\nSupport uploading and replacing the avatar, and show it in employee lists and details.\nUse the new avatar after replacement and keep it visible after refreshing the page.',
        },
      },
    },
    templatePrint: {
      title: 'Template printing',
      summary:
        'Fill Word or Excel templates with business data to produce contracts and forms for download.',
      scenarios: [
        'Turn a purchase order into a PDF ready for signing.',
        'Export a statement for each customer.',
      ],
      prerequisite:
        'Your agent builds it for your business; there is no ready-made print service to install. Have it read the template printing Skill first, and prepare your Word or Excel templates. PDF output needs a converter on the server.',
      prompts: {
        orderPdf: {
          label: 'Print an order',
          text: 'Add a Print order button to purchase order details that fills the Word template I provide.\nFill in the order number, item, applicant, amount, approval status, and line items.\nDownload the result as a PDF whose filename includes the order number.\nOnly people who can view the order can print it; keep the template in the project so an administrator can replace it.',
        },
      },
    },
    workflow: {
      title: 'Workflows',
      summary:
        'Move business records through stages, with waiting, timeouts, retries, and a history of who did what.',
      scenarios: [
        'Purchase orders go from pending approval to pending purchase, received, and completed.',
        'Large exports run in the background and offer a download when done.',
        'See who handled each step of an order, and when.',
      ],
      prerequisite: 'Built in; nothing to prepare.',
      prompts: {
        stages: {
          label: 'Stages',
          text: "Add a process to purchase orders: Pending approval → Pending purchase → Received → Completed.\nReviewers approve or reject; a rejection requires a reason and returns the order to the applicant to revise and resubmit.\nAfter the buyer places the purchase, the order is pending purchase; confirming delivery with a signed receipt moves it to Received, and the applicant's confirmation completes it.\nOrder details offer only the actions of the current stage, and ordinary edits cannot change the stage.\nCheck stages and required information on the server, and never overwrite a result someone else has already submitted.",
        },
        backgroundExport: {
          label: 'Background export',
          text: 'Add an order report page that exports existing orders to CSV.\nAfter submission the export waits to be processed, is generated in the background, and completes with a download link.\nShow the current stage, filename, number of exported orders, and the submission and system processing records.\nRetry failed generation according to rules, and keep a final failure for the owner to handle; running it again must not create duplicate report files.\nKeep the progress and result visible after a page refresh, and allow only authorized people to export orders.',
        },
        history: {
          label: 'History',
          text: 'Show the current stage and processing history in order details.\nEach entry shows who acted, when, the action, the stage before and after, and any rejection reason or signed receipt.\nMark actions performed automatically as done by the system.\nKeep the progress and history after a page refresh, so the whole process can be reviewed once completed.',
        },
      },
    },
    approval: {
      title: 'Approval',
      summary:
        'Multi-level and joint approval, delegation and transfer, with a record of every decision.',
      scenarios: [
        'Orders above 10,000 go to the manager first, then to finance.',
        'A reviewer on a trip hands pending approvals to a colleague.',
      ],
      prerequisite:
        'Needs the commercial plugin @nocobase/app-plugin-approval and its license. For a single confirmation, a workflow is enough.',
      prompts: {
        multiLevel: {
          label: 'Multi-level approval',
          text: 'Add approval to purchase orders.\nOrders of 10,000 or less are approved by the department manager; larger orders go to the department manager and then to finance.\nA rejection at any level returns the order to the applicant with a required reason, and the applicant can resubmit after revising.\nShow the expected route before submission, and the current reviewer and history afterwards.\nAn approved order moves to pending purchase; approval does not mean it has been paid.',
        },
        handover: {
          label: 'Add a reviewer or transfer',
          text: 'Let reviewers add a reviewer or transfer a purchase order approval.\nAdding a reviewer asks a colleague for an opinion first, then returns the decision to the original reviewer.\nTransferring hands the current task to someone else in the same job, with a reason.\nRecord every addition, transfer, and decision in the approval history, and show the applicant who is handling it now.',
        },
      },
    },
    taskCenter: {
      title: 'Task center',
      summary:
        'Gather personal to-dos such as approvals and confirmations in one place, with status and counts.',
      scenarios: [
        'A manager handles leave, expense, and purchase approvals on one page.',
        'The navigation shows how many tasks are pending and updates as they are done.',
      ],
      prerequisite:
        'Your agent builds it for your business; no extra plugin. Works best once the application has approvals or processes.',
      prompts: {
        myTasks: {
          label: 'My tasks',
          text: 'Add a My tasks page where each person sees only what they need to handle.\nSeparate pending, completed, and canceled tasks, and show how many there are of each.\nOpening a task leads to the business record to handle it; status and counts update afterwards.\nShow the pending count in the navigation.',
        },
        approvals: {
          label: 'Bring in approvals',
          text: 'Add the existing purchase order approvals to My tasks, so the people who actually approve them see the request type, number, and submission time.\nKeep the approval rules unchanged; approving works straight from the task.',
        },
      },
    },
    notification: {
      title: 'Notifications',
      summary:
        'Send in-app messages, email, or group bot messages when something happens.',
      scenarios: [
        'After a decision, the applicant gets an in-app message that opens the order.',
        'Also send the applicant an email.',
      ],
      prerequisite:
        'In-app messages are built in. Email and group bots need a sending channel configured.',
      prompts: {
        inApp: {
          label: 'In-app message',
          text: "Add order approval to the current application and notify applicants of the results through in-app messages.\n\nOrders include a number, name, applicant, amount, and approval status.\nApplicants can view their own orders. Reviewers can view pending orders and approve or reject them. Reuse existing order and approval features if available.\n\nAfter approval or rejection, send one in-app message only to the order's applicant.\nThe title indicates whether the order was approved or rejected. The body includes the order number, name, and approval result.\nClicking the message opens the corresponding order details.\nDo not send while approval is pending. Notify only once for the same approval result.\nA notification failure does not affect the saved approval result.",
        },
        email: {
          label: 'Email',
          text: "Add email to the existing order approval notifications, using the application's configured email channel.\n\nAfter an order is approved or rejected, send the result to the applicant's account email.\nInclude the order number in the subject and the order name and result in the body.\nKeep the existing in-app messages. If the applicant has no email address, send only the in-app message.\nAn email failure must not affect the approval result or in-app message.",
        },
      },
    },
    mail: {
      title: 'Mail',
      summary:
        'Connect personal mailboxes, then read, reply to, and send business email.',
      scenarios: [
        'Sales sees and replies to customer emails right in customer details.',
        'Employees handle work email inside the application.',
      ],
      prerequisite:
        'Needs a mail provider configured (IMAP and SMTP servers); each user then connects their own mailbox.',
      prompts: {
        providers: {
          label: 'Mail provider',
          text: "Configure mailbox.org for the application in the server configuration's mail.providers:\n- IMAP incoming server: imap.mailbox.org, port 993, SSL/TLS.\n- SMTP outgoing server: smtp.mailbox.org, port 465, SSL/TLS.\nUsers enter their own email address, username, and password on the mailbox accounts page and choose the date to start the first synchronization from; never write mailbox passwords into configuration or source code.",
        },
        mailCenter: {
          label: 'Mail center',
          text: 'Mail is built into this application; reuse it instead of building it again or installing another plugin.\nAdd Mail center and Mailbox accounts pages to the navigation, using the mail workspace and mailbox accounts pages the mail capability provides.\nUsers can connect their own mailboxes, synchronize incoming messages, read messages and attachments, and reply, keeping the original subject and conversation context and addressing the reply to the original sender.\nEach user works with their own connected mailboxes.',
        },
        correspondence: {
          label: 'Customer emails',
          text: "Add a correspondence section to customer details, reusing the application's built-in mail reading and compose components.\nShow messages whose sender or recipient matches the current customer's contact email addresses. Sales representatives can read messages, view attachments, and reply using their own connected mailboxes.",
        },
      },
    },
    scheduler: {
      title: 'Scheduled tasks',
      summary:
        'Run business work at set times, and see the next run and its results.',
      scenarios: [
        'Remind reviewers of pending orders every weekday morning.',
        "Build last week's sales summary every Monday.",
      ],
      prerequisite: 'Built in; nothing to prepare.',
      prompts: {
        reminder: {
          label: 'Daily reminder',
          text: 'Add a Pending order reminder to the existing order application.\n\nAt 09:00 Beijing time every weekday, find orders awaiting approval, group them by reviewer, and send each reviewer one in-app notification.\nInclude the pending order count and link to the pending order list. Send nothing when there are no pending orders.\nAdministrators can view the schedule and execution records, and pause or resume reminders.',
        },
        weeklyReport: {
          label: 'Weekly report',
          text: "At 08:00 Beijing time every Monday, generate last week's sales summary and notify the sales manager.\nInclude sales revenue, order count, and regional totals. Administrators can view the task and execution records.",
        },
      },
    },
    theme: {
      title: 'Themes',
      summary:
        'Adjust colors, fonts, and density, and switch between light and dark.',
      scenarios: [
        'Use the company brand color.',
        'Use a compact layout for data-heavy pages.',
      ],
      prerequisite: 'Built in; nothing to prepare.',
      prompts: {
        changeTheme: {
          label: 'Change a theme',
          text: 'Update the Compact theme: use blue as the primary color and slightly increase the corner radius. Keep the current fonts, text sizes, and compact spacing.',
        },
        newTheme: {
          label: 'New theme',
          text: 'Create a Forest theme with green as the primary color, soft backgrounds, moderately rounded corners, and subtle shadows.',
        },
      },
    },
    i18n: {
      title: 'Languages',
      summary:
        'Switch the interface language, add languages, and set the default one.',
      scenarios: [
        'Add Spanish for colleagues abroad.',
        'Show Chinese to people who have not chosen a language.',
      ],
      prerequisite: 'Built in; nothing to prepare.',
      prompts: {
        addLanguage: {
          label: 'Add a language',
          text: 'Add Spanish to my application. Translate the interface and server messages, and add Spanish to the language menu.',
        },
        defaultLanguage: {
          label: 'Default language',
          text: "Make Simplified Chinese the application's default language for people who have not chosen one. Keep English available in the language menu.",
        },
      },
    },
    aiEmployee: {
      title: 'AI employees',
      summary:
        'Add AI assistants to business pages that understand the page, query data, and act within rules.',
      scenarios: [
        'Ask "where is this order stuck?" from its details.',
        "Find this month's orders above 10,000 in one sentence.",
      ],
      prerequisite:
        'Needs the Agents plugin and a working model service, in the cloud or local.',
      prompts: {
        assistant: {
          label: 'Purchasing assistant',
          text: "Add a Purchasing assistant to the purchase order application, using the model service I have configured.\nIt explains orders, finds orders awaiting approval, and gives advice based on the purchasing policy.\nConnect a read-orders business action that keeps the current user's data access; allow queries only for now, without changing orders or sending notifications.\nOffer a conversation entry in the order list and details, where employees can ask follow-up questions and open the orders in an answer.",
        },
      },
    },
    aiKnowledgeBase: {
      title: 'AI knowledge bases',
      summary:
        'Organize policies, manuals, and notes for employees to read and for AI to answer from.',
      scenarios: [
        'Employees look up the purchasing policy and supplier admission rules.',
        'The purchasing assistant cites the policy text it answers from.',
      ],
      prerequisite:
        'Needs the knowledge plugin. AI answers need a model; semantic search also needs an index.',
      prompts: {
        policies: {
          label: 'Purchasing policies',
          text: 'Add a knowledge center to the purchase order application with the purchasing policy, supplier admission rules, and FAQs.\nProvide reading and search for folders, articles, and files, with access controlled by job.\nLet the purchasing assistant answer from these materials and link to the relevant documents and passages.',
        },
      },
    },
  },
};

export default enUS;
