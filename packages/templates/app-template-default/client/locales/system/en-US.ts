import settings from './settings-en-US.js';
import type { LocaleResource } from '@nocobase/i18n';
import deviceApprovalEnUS from '#extensions/nocobase-device-approval/locales/en-US';
import inboxEnUS from '#extensions/nocobase-inbox/locales/en-US';

/**
 * The copy of what the template ships: the shell, the sign-in pages, shared components and the homepage. A template
 * upgrade replaces this file, so put the application's own copy in `../en-US.ts` rather than here.
 */
const systemEnUS = {
  flowDiagram: {
    controls: 'Diagram controls',
    fitView: 'Fit to view',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    escapeHint: 'Press Escape to exit',
    leavesTo: 'Leaves to',
    arrivesFrom: 'Arrives from',
    otherRoutes: 'Other routes',
    minimap: 'Diagram overview',

    configure: 'Configure',
    overview: 'Diagram overview',
    actualSize: 'Actual size',
    states: 'States',
    transitions: 'Transitions',
    configurable: 'Parameters',
    current: 'Current',
    visited: 'Visited',
    initial: 'Initial',
    final: 'Final',
    state: 'State',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    fit: 'Fit to view',

    empty: 'No states to display.',
    loading: 'Laying out diagram…',
    failed: 'Unable to lay out this diagram.',
    nodeHelp: 'Press Enter or Space to select a state.',
    edgeHelp: 'Press Enter or Space to select a transition.',
  },
  settings,
  'auth.preparingSession': 'Preparing your session…',
  'auth.connectionFailed': 'Unable to connect',
  'auth.connectionFailedDescription':
    'The realtime connection could not be prepared. Retry to enter the application, or sign out.',

  'auth.passwordResetSuccess':
    'Your password has been reset. Sign in with your new password.',
  'auth.requestNewResetLink': 'Request a new reset link',

  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  // Shared form wording overrides the defaults included by composed blocks.
  formFeedback: {
    field: 'This value was rejected. Check it and try again.',
    invalid: 'Check the highlighted fields and try again.',
    failed: 'Unable to save. Your input has been kept. Try again.',
    network:
      'Unable to connect. Check your connection and try again. Your input has been kept.',
    denied:
      'You cannot submit this form with your current access. Your input has been kept.',
  },
  // The UI Library component of the header's inbox button.
  'inboxButton.title': 'Inbox',
  'inboxButton.pending': 'Inbox, {{count}} waiting',
  'inboxButton.unread': 'Inbox, {{count}} unread',
  'inboxButton.pendingHint':
    '{{count}} waiting for you; it goes down once they are handled.',
  'inboxButton.unreadHint': '{{count}} unread; it goes down as you read them.',
  'auth.welcome': 'Welcome back',
  'auth.loginDescription': 'Sign in with your username or email and password.',
  'auth.registerTitle': 'Create an account',
  'auth.registerDescription': 'Create an account to get started.',
  'auth.forgotTitle': 'Forgot password',
  'auth.forgotDescription':
    'Enter your email and we will send a reset link if the account exists.',
  'auth.passwordResetUnavailable':
    'Self-service password reset is not enabled. Contact an administrator to reset your password.',
  'auth.capabilityLoadFailed': 'Could not check password reset availability.',
  'auth.retry': 'Retry',
  'auth.loading': 'Loading',
  'auth.resetDescription': 'Choose a new password for your account.',
  'auth.resetTitle': 'Reset password',
  'auth.identifier': 'Username or email',
  'auth.password': 'Password',
  'auth.signIn': 'Sign in',
  'auth.signingIn': 'Signing in…',
  'auth.hidePassword': 'Hide password',
  'auth.showPassword': 'Show password',
  'auth.forgotLink': 'Forgot password?',
  'auth.noAccount': "Don't have an account?",
  'auth.signUp': 'Sign up',
  'auth.createAccount': 'Create account',
  'auth.creatingAccount': 'Creating account…',
  'auth.name': 'Name',
  'auth.username': 'Username',
  'auth.email': 'Email',
  'auth.confirmPassword': 'Confirm password',
  'auth.existingAccount': 'Already have an account?',
  'auth.passwordMismatch': "Passwords don't match.",
  'auth.resetting': 'Resetting…',
  'auth.newPassword': 'New password',
  'auth.confirmNewPassword': 'Confirm new password',
  'auth.invalidResetLink':
    'This password reset link is invalid or has expired.',
  'auth.backToSignIn': 'Back to sign in',
  'auth.sendResetLink': 'Send reset link',
  'auth.sending': 'Sending…',
  'auth.resetSent': 'If the account exists, a reset link has been sent.',
  'auth.rememberPassword': 'Remember your password?',
  'auth.methods': 'Sign-in methods',
  'auth.or': 'Or continue with',
  'auth.continueWith': 'Continue with {provider}',
  'auth.about': 'About this application',
  'auth.platform': 'AI-native application platform',
  'auth.marketingTitleFirst': 'Let AI build freely.',
  'auth.marketingTitleSecond': 'NocoBase keeps it',
  'auth.marketingTitleThird': 'reliable.',
  'auth.marketingDescription':
    'Give AI a flexible frontend framework to shape each experience, while NocoBase secures the data, permissions and governance underneath.',
  'auth.frontend': 'AI-native frontend',
  'auth.frontendDescription':
    'Compose interfaces freely on a flexible framework.',
  'auth.foundation': 'NocoBase foundation',
  'auth.foundationDescription': 'Reliable data, access control and governance.',
  'auth.marketingFooter': 'Freedom above. Confidence below.',
  'status.loading': 'Loading',
  'status.loadingPage': 'Loading page',
  'status.denied': 'Access denied',
  'status.pageFailed': 'Unable to load page',
  'status.retry': 'Retry',
  'navigation.brandHome': 'NocoBase home',
  'navigation.brandApps': 'NocoBase applications',
  'routeOverlay.close': 'Close',
  'status.deniedDescription': 'You do not have permission to access {{label}}.',
  'status.routeFailedDescription':
    'Route {{label}} from {{packageName}} could not be loaded.',
  shell: {
    buildFreely: 'AI builds freely.',
    reliability: '<brand>NocoBase</brand> keeps it reliable.',
  },
  home: {
    platform: 'NocoBase · AI-native application platform',
    title: 'Describe it, and your agent builds it',
    description:
      'This application is developed by talking to your coding agent. Tell it what the business needs in plain words, and it writes the pages, data models, APIs, and business processes in this project.',
    steps: {
      describe: {
        title: 'Describe the need',
        description:
          'Say who uses it, what data it keeps, and what should happen.',
      },
      build: {
        title: 'Let the agent build',
        description:
          'It reads this project and its built-in capabilities, then writes the code.',
      },
      review: {
        title: 'Check and refine',
        description:
          'Refresh the page to try it, then ask for changes in the same way.',
      },
    },
    example: {
      title: 'Try a request like this',
      text: 'Build a purchase order application.\n\nAn order has a number, item, applicant, amount, and approval status. Applicants create orders and see only their own; reviewers see all pending orders and approve or reject them.\nAfter a decision, notify the applicant in the inbox with a link to the order.',
      hint: 'Paste it into Claude Code, Codex, Cursor, or any coding agent opened in this project.',
    },
    capabilitiesTitle: 'Built-in capabilities',
    capabilitiesDescription:
      'Your agent uses these directly instead of building them from scratch. Open one to get a prompt you can edit and copy.',
    viewPrompts: 'View prompts ({{count}})',
    prompt: {
      label: 'Prompt',
      hint: 'Edit the prompt to fit your business before copying. Changes are not saved after the dialog closes.',
      copy: 'Copy',
      copiedShort: 'Copied',
      copied: 'Prompt copied',
      copyFailed: 'Unable to copy. Select the text and copy it manually.',
      reset: 'Restore default',
    },
    capabilities: {
      auth: {
        title: 'Authentication',
        description:
          'Sign-in, registration, password reset, and company single sign-on.',
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
      dataSources: {
        title: 'Data sources',
        description:
          'Choose the application database and use business data from existing external databases.',
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
      authorization: {
        title: 'Permissions',
        description:
          'Control who can open which pages, run which actions, and see which records.',
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
      workflow: {
        title: 'Workflows',
        description:
          'Move business records through stages, with waiting, timeouts, retries, and a history of who did what.',
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
      scheduler: {
        title: 'Scheduled tasks',
        description:
          'Run business work at set times, and see the next run and its results.',
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
      notification: {
        title: 'Notifications',
        description:
          'Send in-app messages, email, or group bot messages when something happens.',
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
        description:
          'Connect personal mailboxes, then read, reply to, and send business email.',
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
      file: {
        title: 'Files',
        description:
          'Upload files, attach them to records, and preview or download them.',
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
      i18n: {
        title: 'Languages',
        description:
          'Switch the interface language, add languages, and set the default one.',
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
      theme: {
        title: 'Themes',
        description:
          'Adjust colors, fonts, and density, and switch between light and dark.',
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
    },
  },

  appearance: {
    title: 'Appearance',
    mode: 'Color mode',
    preset: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    themes: { default: 'Spacious', compact: 'Compact' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    language: 'Language',
  },
  notices: {
    serverLocaleFallback:
      'The server does not support this language, so server messages will use English.',
    languageChangeFailed:
      'Unable to complete the language change. Please try again.',
  },
  account: {
    signOutFailed: 'Unable to sign out. Please try again.',
    openMenu: 'Open account menu',
    fallback: 'Account',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
  },
  navigation: {
    home: 'Home',
    open: 'Open navigation',
    close: 'Close navigation',
    expand: 'Expand navigation',
    collapse: 'Collapse navigation',
    toggle: 'Expand or collapse navigation',
    label: 'Application navigation',
    description: 'Go to a page of this application.',
    breadcrumb: 'Breadcrumb',
    breadcrumbMore: 'Show the levels in between',
    back: 'Back',
  },
  dataTable: {
    noResults: 'No results.',
    sortAscending: 'Asc',
    sortDescending: 'Desc',
    hideColumn: 'Hide',
    view: 'View',
    toggleColumns: 'Toggle columns',
    selectedCount: '{{selected}} of {{total}} row(s) selected.',
    rowsPerPage: 'Rows per page',
    pageOf: 'Page {{page}} of {{pageCount}}',
    firstPage: 'Go to first page',
    previousPage: 'Go to previous page',
    nextPage: 'Go to next page',
    lastPage: 'Go to last page',
  },
  datePicker: {
    placeholder: 'Pick a date',
    rangePlaceholder: 'Pick a date range',
  },
};

/** The shape every locale's system copy follows, derived from the English wording above. */
export type SystemResource = LocaleResource<typeof systemEnUS>;

export default systemEnUS;
