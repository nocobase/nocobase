/** Read the actual vertical scroller around a semantic table, rail or activity region. */
import type { Browser } from '@playwright/test';
import { apiAs } from './fixtures.ts';

/** Isolated contributor viewers can create/edit their own fixtures but cannot delete issues. */
export async function deleteTestIssues(
  browser: Browser,
  ids: readonly string[],
) {
  const admin = await apiAs(browser, 'alex');
  try {
    for (const id of ids) await admin.api.delete(`projects/issues/${id}`);
  } finally {
    await admin.close();
  }
}

export { wheelTo, workspaceGeometry } from './personal-task-geometry.ts';
