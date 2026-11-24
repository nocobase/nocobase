// The shared components the Roles and permissions pages render: tables, list and form feedback, and close buttons.
const components = {
  actions: {
    close: 'Close',
  },
  dataTable: {
    noResults: 'No results',
    sortAscending: 'Asc',
    sortDescending: 'Desc',
    sort: 'Sort',
    sortBy: 'Sort by',
    filters: 'Filters',
    filtersApplied: 'Filters · {{count}}',
    selectPage: 'Select all on this page',
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
  formFeedback: {
    field: 'This value was rejected. Check it and try again.',
    invalid: 'Check the highlighted fields and try again.',
    failed: 'Unable to save. Your input has been kept. Try again.',
    network:
      'Unable to connect. Check your connection and try again. Your input has been kept.',
    denied:
      'You cannot submit this form with your current access. Your input has been kept.',
  },
  listFeedback: {
    loading: 'Loading',
    empty: 'No data yet',
    noResults: 'No results',
    forbidden: 'Access denied',
    unauthenticated: 'Session expired',
    failed: 'Unable to load list',
    refreshFailed: 'Refresh failed; showing previous data',
    retry: 'Retry',
    retrying: 'Retrying…',
    clear: 'Clear filters',
    signIn: 'Sign in',
  },
  status: {
    loading: 'Loading',
    refreshing: 'Refreshing',
  },
  pendingFeedback: {
    working: 'Working…',
    longWait: 'This is taking longer than usual. You can keep waiting.',
  },
};

export default components;
