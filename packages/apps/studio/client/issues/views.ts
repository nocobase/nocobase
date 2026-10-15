/** The views of the issue lists, in the order every page offers them (`issues-view.tsx`). */
export type StudioIssueView = 'split' | 'list' | 'board' | 'agent';

/** Every page offers the views in this order. */
export const STUDIO_ISSUE_VIEWS: readonly StudioIssueView[] = [
  'split',
  'list',
  'board',
  'agent',
];
