/** Standard category palette, shared by validation and the editor. */
export const workflowCategoryColors = {
  gray: '#64748b',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  green: '#22c55e',
  teal: '#14b8a6',
  blue: '#3b82f6',
  indigo: '#6366f1',
  purple: '#a855f7',
  pink: '#ec4899',
} as const;
export type WorkflowCategoryColor = keyof typeof workflowCategoryColors;
