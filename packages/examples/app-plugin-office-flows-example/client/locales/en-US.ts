import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  navigation: {
    group: 'Office Flows Example',
    dataRequests: 'Data usage requests',
    incoming: 'Incoming documents',
    tasks: 'My tasks',
    configuration: 'Configuration',
  },
  dataRequests: {
    title: 'Data usage requests',
    description:
      'An applicant asks to use data; three managers approve; acceptance follows the extraction tasks, which a schedule creates for each period, moved off weekends and public holidays.',
    list: 'Requests',
    create: 'New request',
    submit: 'Save and submit',
  },
  extractions: { create: 'Create extraction task' },
  incoming: {
    title: 'Incoming documents',
    description:
      'The office records a document; its head and leader approve; the registrar distributes it to departments, whose clerks may hand it on to execution teams and executors. Each person is reminded once per level.',
    list: 'Documents',
    create: 'Record a document',
    submit: 'Save and submit',
  },
  tasks: {
    title: 'My tasks',
    description:
      'Clerk, execution-team and executor tasks of the person you act as, and the reminders they received.',
    mine: 'Tasks',
    none: 'No tasks for this person.',
    pick: 'Pick a task to work on it.',
    notices: 'Reminders',
    noticesNote:
      'One reminder per document and level, however many rows name the person.',
    noNotices: 'No reminders yet.',
  },
  configuration: {
    title: 'Configuration',
    description:
      'Demonstration data the processes read: the people a department row brings in, management groups, and the 2026 holiday calendar.',
  },
  common: {
    created: 'Created',
    actAs: 'Act as',
    save: 'Save',
    delete: 'Delete',
    reason: 'Reason',
    notAllowed: 'This person may not do this now.',
    final: 'No transition leaves this state.',
    history: 'History',
    noHistory: 'Nothing has happened yet.',
    empty: 'Nothing here yet.',
    pick: 'Pick a record, or create one.',
    loading: 'Loading…',
    remove: 'Remove {{name}}',
  },
  rows: {
    department: 'Department',
    clerks: 'Clerks',
    heads: 'Copy: heads and others',
    leaders: 'Copy: supervising leaders',
    dispatched: 'Dispatched',
    yes: 'Yes',
    no: 'No',
    empty: 'No rows yet.',
    pickDepartment: 'Pick a department',
    assist: '(assisting)',
    assistOther: 'Assist from another department',
    add: 'Add row',
    addAssist: 'Save and create the assisting task',
  },
  processing: {
    number: 'Number',
    node: 'Node',
    assignees: 'Assignees',
    feedback: 'Feedback',
    attachments: 'Attachments',
    empty: 'No tasks at this level.',
  },
  trace: {
    departments: 'Departments',
    groups: 'Groups',
    notified: 'Reminded',
    skipped: 'Already reminded, skipped',
  },
  runs: {
    queued: 'Queued',
    running: 'Running',
    succeeded: 'Succeeded',
    failed: 'Failed',
    dead: 'Gave up',
    cancelled: 'Cancelled',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type OfficeFlowsExampleResource = LocaleResource<typeof enUS>;

export default enUS;
