/**
 * The wording of the task-center-ui components' own chrome, under `taskCenterUi`. Everything the data says — sources,
 * subjects, titles, statuses, summaries and batch actions — arrives translated from the page; merge these into the
 * locale resources of the namespace that renders the components.
 */
const enUS = {
  taskCenterUi: {
    nav: {
      label: 'Task sources',
      search: 'Search task types',
      noMatches: 'No task type matches',
      clearSearch: 'Clear search',
      expand: 'Expand {{name}}',
      collapse: 'Collapse {{name}}',
      subjects: 'Task types of {{name}}',
      pending: '{{count}} to do',
    },
    tabs: {
      pending: 'To do',
      closed: 'Done',
      all: 'All',
    },
    groups: {
      today: 'Today',
      yesterday: 'Yesterday',
      earlier: 'Earlier',
    },
    time: {
      received: 'Arrived {{time}}',
      closed: 'Closed {{time}}',
    },
    selection: {
      select: 'Select "{{name}}"',
      lockedTask:
        '"{{name}}" is unavailable: {{type}} is selected, and only tasks of one type can be selected together',
      otherType:
        '{{type}} is selected; only tasks of one type can be selected together',
      unsupportedTask: '"{{name}}" has no batch actions',
      unsupported: 'Tasks of this type are handled one at a time',
    },
    bulk: {
      label: 'Batch actions',
      selected: '{{count}} selected',
      clear: 'Clear selection',
      cancel: 'Cancel',
      skipped:
        '{{count}} other selected tasks do not support it and stay as they are.',
    },
    empty: {
      pending: {
        title: 'All caught up',
        description: 'Nothing here is waiting for you.',
      },
      closed: {
        title: 'Nothing done yet',
        description: 'Tasks you finish or that are cancelled appear here.',
      },
      all: {
        title: 'No tasks',
        description: 'Tasks of this type appear here when they reach you.',
      },
      showAll: 'Show all',
    },
    loading: 'Loading tasks',
    pagination: {
      label: 'Pages',
      summary: 'Page {{page}} of {{pages}}, {{total}} tasks',
      previous: 'Previous',
      next: 'Next',
    },
  },
};

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** The shape every locale of task-center-ui has. */
export type TaskCenterUiLocale = Widen<typeof enUS>;

const locale: TaskCenterUiLocale = enUS;

export default locale;
