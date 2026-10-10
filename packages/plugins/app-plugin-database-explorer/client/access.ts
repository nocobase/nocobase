/**
 * The grant the server checks on every Database Explorer endpoint. A page an application builds on
 * `DatabaseExplorerClient` declares the same check, so hiding its navigation entry and refusing a direct API call are
 * one grant rather than two.
 */
export const DATABASE_EXPLORER_ACCESS = {
  resource: { type: 'page', id: 'database-explorer' },
  action: 'access',
} as const;
