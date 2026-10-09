/**
 * The wording of the approval-ui components' own chrome, under
 * `approvalUi`. Everything the data says — stage titles, states, answers,
 * policies — arrives translated from the page; merge these into the locale
 * resources of the namespace that renders the components.
 */
const enUS = {
  approvalUi: {
    timeline: {
      onBehalf: 'for {{name}}',
      showEvents: 'What changed ({{count}})',
      system: '{{count}} system updates',
      empty: 'Nothing has happened yet.',
    },
    progress: {
      empty: 'No approval has started yet.',
      copies: 'Copied to',
      read: 'read',
      unread: 'unread',
      step: {
        current: 'in progress',
        rejected: 'rejected',
        returned: 'returned',
        ended: 'ended',
        skipped: 'skipped',
      },
      tally: {
        answered: '{{count}} of {{total}} answered',
        needed: '{{count}} needed to pass',
      },
    },
    branches: {
      done: '{{count}} of {{total}} finished',
      blocked: 'Holding the request up',
    },
    receipts: {
      read: 'Read',
      confirmed: 'Confirmed',
      empty: 'Nobody has received it yet.',
    },
    preview: {
      title: 'Who will decide',
      loading: 'Working out the route…',
      submit: 'Submit',
      finished: 'Decided',
      automatic: 'Approved without a decision',
      parallel: 'In parallel',
      optional: 'Optional',
      nobody: 'Nobody qualified yet',
      none: 'This request is decided without an approval.',
      skipped: 'Not needed: {{stages}}',
    },
    actions: {
      more: 'More',
      all: 'Actions',
      admin: 'Administration',
      confirm: '{{action}}?',
      loading: 'Loading…',
      loadFailed: 'This could not be loaded. Close it and try again.',
      cancel: 'Cancel',
    },
  },
};

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** The shape every locale of approval-ui has. */
export type ApprovalUiLocale = Widen<typeof enUS>;

const locale: ApprovalUiLocale = enUS;

export default locale;
