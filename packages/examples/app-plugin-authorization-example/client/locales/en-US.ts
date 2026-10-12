export default {
  practice: {
    intro:
      'Use the accounts below instead of an administrator. Administrators bypass the restrictions. These are independent sales collaboration exercises, not a complete quote-to-order approval workflow. Each exercise starts from the seeded record state.',
    read: {
      title: 'An assistant consults project information',
      steps:
        'Sign in as sales_assistant: Projects shows project-1, project-2 and project-3, but no edit actions. Quotes and orders remain limited to the owned project.',
      reason:
        'Project sharing grants records for viewing only; it grants neither editing nor related records. Confidential project-4 stays excluded.',
    },
    scopes: {
      title: 'An engineer prepares and submits a quote',
      steps:
        'Sign in as sales_engineer: edit and submit your quote-2. You may consult quote-5, but cannot change or submit a colleague’s quote. You may continue preparing quote-6, but cannot submit it for a project outside your region.',
      reason:
        'Non-confidential quotes are internal reference material across regions. The preparer owns the content; regional responsibility governs submission. Viewing does not grant editing. Existing orders reference separate accepted quotes; submitting a practice quote does not create an order.',
    },
    handover: {
      title: 'A delegated engineer takes over a quote',
      steps:
        'A South-region project owner hands quote-7 to sales_proposal, an engineer from the North region. Sign in as sales_proposal, edit the quote and submit it. As an administrator, reset the records and remove sales_proposal from the Proposal quote handover sharing rule. Sign in again: the account can no longer edit or submit this quote.',
      reason:
        'The handover permits editing and submitting this quote plus the project access needed for submission; it does not delegate the entire South region. The engineer role grants operations, while sharing identifies the records. As an advanced exercise, withdraw either the project or quote scope: submission requires both.',
    },
    delivery: {
      title: 'A delivery specialist fulfils an order',
      steps:
        'Sign in as sales_delivery. Open order-2, assign a carrier, maintain checks and enter a delivery reference. After confirming delivery, neither its relations nor its delivery state can be changed again. Reset the records before repeating the exercise.',
      reason:
        'Delivery staff enter Orders only; links to quotes and projects do not grant access to those pages.',
    },
  },
  reset: {
    action: 'Reset practice records',
    cancel: 'Cancel',
    confirm:
      'Restore the seeded projects, quotes and orders for every demo account? Changes to those records will be overwritten.',
    description:
      'An administrator can reset business records here before repeating an exercise. Accounts and permission settings are preserved; restore any authorization changes manually.',
    done: 'Practice records restored. Refresh any open record lists.',
  },

  access: {
    title: 'Your roles',
    direct: 'Direct assignment',
    coverage:
      'Each example account holds its job responsibilities through a direct assignment.',
  },
  rules: {
    public: 'Exclude confidential projects',
    delivery: 'Regional orders for delivery',
    handover: 'Proposal quote handover',
    projects: 'Shared example projects',
  },
  accountMenus: {
    assistant: 'Projects, quotes and orders (read only)',
    engineer:
      'Consult non-confidential quotes; edit own quotes and submit within the assigned region',
    manager: 'Manage owned projects; quotes and orders are read only',
    delivery: 'Orders only; confirm regional deliveries',
    proposal: 'Edit and submit the handed-over quote-7',
    coordinator: 'Manage project-8, outside the home region',
  },
  relations: {
    access: {
      notGranted: 'Read only: delivery coordination is not granted.',
      outsideScope: 'Read only: this order is outside your delivery scope.',
      notReady: 'Delivered orders cannot be changed.',
    },
    title: 'Order relationships',
    description:
      'Assign an active carrier, maintain checks, and manage collaborating carriers. Try a delivery account and a read-only account to compare access.',
    order: 'Order',
    carrier: 'Carrier',
    unassigned: 'None assigned',
    assign: 'Assign carrier',
    disconnect: 'Remove assignment',
    checks: 'Delivery checks',
    done: 'Done',
    pending: 'Pending',
    toggle: 'Toggle completion',
    delete: 'Delete check',
    checkTitle: 'Check title',
    add: 'Add check',
    collaborators: 'Collaborating carriers',
    note: 'Collaboration note',
    addProposal: 'Add selected carrier',
    replace: 'Replace with selected carrier',
    clear: 'Remove all collaborators',
    unavailable: 'These relationships are not accessible.',
    loading: 'Loading relationships…',
  },
  sales: {
    manageRelations: 'Arrange order delivery',
    saveFirst: 'Save changes before submitting.',
    states: {
      draft: 'Draft',
      submitted: 'Submitted',
      accepted: 'Accepted',
      ready: 'Ready',
      delivered: 'Delivered',
    },
    errors: {
      session: 'Session expired. Sign in again.',
      input: 'Check the amount and required fields.',
      conflict: 'The record state changed. Refresh before trying again.',
      request: 'Request failed. Check your connection and try again.',
    },

    operation: {
      outsideScope: 'Outside permitted operation scope',
      notReady: 'Only ready orders can be delivered',

      allowed: 'Within submission scope',
      notGranted: 'Read only — operation not granted',
      quoteScope: 'Outside permitted quote scope',
      projectScope: 'Project outside permitted scope',
      notDraft: 'Only drafts can be submitted',
      invalidAmount: 'Amount must be positive',
    },
    preparedBy: 'Prepared by',
    parentProject: 'Project',
    sourceQuote: 'Source quote',
    relationships: 'Related records',
    relatedQuotes: 'Project quotes',
    relatedOrders: 'Project orders',
    filtered: 'Filtered by',
    clearFilter: 'Clear filter',
    noPageAccess: 'No page access',
    descriptions: {
      projects:
        'Open related quotes and orders from a project. Related lists show only records this account can access.',
      quotes:
        'A project can have several quotes. Submission checks project scope and quote preparer independently, then validates draft status and amount.',
      orders:
        'Each order references its source quote and project. Delivery accounts only enter Orders; references do not grant access to other pages or records.',
    },

    delivery: 'Delivery',
    orders: 'Orders',
    editProject: 'Edit project information',
    editQuote: 'Edit pricing',
    submit: 'Submit quote',
    submitScopes: {
      projects: 'Projects linked to the quotes',
      quotes: 'Quotes allowed for submission',
    },
    deliver: 'Confirm delivery',
    amount: 'Amount',
    status: 'Status',
    deliveryReference: 'Delivery reference',

    group: 'Sales collaboration',
    title: 'Sales permissions example',
    projects: 'Projects',
    quotes: 'Quotes',
    view: 'View',
    edit: 'Edit notes',
    intro:
      'Explore the access boundaries of assistants consulting records, engineers preparing quotes, delegated quote handovers and delivery staff fulfilling orders.',
    record: 'Record',
    notes: 'Notes',
    save: 'Save',
    refresh: 'Refresh',
    loading: 'Loading…',
    empty: 'No accessible records',
    readOnly: 'Read only',
    saved: 'Saved',
    scope: {
      prepared: 'Quotes prepared by me',
      title: 'Sales data scope',
      unrestricted: 'No restriction',
      region: 'My region',
      own: 'Parent project owned by me',
      public: 'Non-confidential projects',
    },
  },
  title: 'Sales permissions example',
  overview: 'Guide',
  actions: 'Actions',
  testAccounts: 'Example accounts',
  account: 'Account',
  permissionSet: 'Permission set',
  password: 'Example password: AuthzExample123!',
  tryTitle: 'Configure and verify',
  roles: {
    assistant: 'Sales assistant',
    engineer: 'Sales engineer',
    manager: 'Project manager',
    delivery: 'Delivery specialist',
  },
  forbidden: 'You do not have permission for this operation.',
  error: 'Failed to load. Please try again.',
};
