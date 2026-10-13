import { mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  expect,
  horizontalOverflow,
  open,
  test,
  unique,
  url,
} from './support/fixtures.ts';
import { STUDIO_ROOT } from './support/server.ts';
import type { TaskTrees } from '../shared/task-trees.js';

test.use({ user: 'admin' });
test.setTimeout(240_000);
const directory = path.join(STUDIO_ROOT, 'output/screenshots/task-trees');
interface Task {
  id: string;
  identifier: string;
  revision: number;
  statusKey: string;
  title: string;
}

test('separate pages default to table, preserve view choices, and expose grouped hierarchy accessibly', async ({
  page,
  api,
}) => {
  mkdirSync(directory, { recursive: true });
  await api.patch('users/me/preferences', {
    locale: 'en-US',
    'theme.mode': 'light',
    'theme.preset': 'compact',
  });
  await page.addInitScript(
    `localStorage.setItem('nocobase.locale','en-US'); localStorage.removeItem('pm:issues-view:issues'); localStorage.removeItem('pm:issues-view:my-issues');`,
  );
  const tag = `Hierarchy ${unique()}`;
  const parent = await api.post<Task>('projects/issues', {
    title: `${tag} parent context`,
    statusKey: 'in_progress',
    executor: null,
    start: false,
  });
  const child = await api.post<Task>('projects/issues', {
    title: `${tag} matching question`,
    statusKey: 'in_progress',
    parentIssueId: parent.id,
    executor: null,
    start: false,
  });
  const review = await api.post<Task>('projects/issues', {
    title: `${tag} review`,
    statusKey: 'in_progress',
    parentIssueId: parent.id,
    executor: null,
    start: false,
  });
  await api.patch(`projects/issues/${child.id}`, {
    revision: child.revision,
    statusKey: 'blocked',
  });
  await api.patch(`projects/issues/${review.id}`, {
    revision: review.revision,
    statusKey: 'in_review',
  });
  const screenshots = async (name: string) => {
    await page.screenshot({
      path: path.join(directory, `${name}.png`),
      fullPage: true,
    });
  };
  await open(page, `/issues?q=${encodeURIComponent(tag)}`);
  await expect(page.getByRole('table')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'List', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: 'Collapse Needs input', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('row', { name: new RegExp(parent.identifier) }),
  ).toContainText('In progress');
  await screenshots('tasks-default-table');
  const disclosure = page.getByRole('button', {
    name: `Expand subtasks of ${parent.identifier}`,
    exact: true,
  });
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('link', { name: child.identifier, exact: true }),
  ).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/main/issues');
  await screenshots('tasks-expanded-descendants');
  const collapsed = page.getByRole('button', {
    name: 'Collapse Needs input',
    exact: true,
  });
  await collapsed.focus();
  await page.keyboard.press('Space');
  await expect(
    page.getByRole('link', { name: child.identifier, exact: true }),
  ).toHaveCount(0);
  await screenshots('tasks-collapsed-group');
  await page
    .getByRole('button', { name: 'Expand Needs input', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: child.identifier, exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: child.identifier, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(child.id));
  await page.goBack();
  await expect(
    page.getByRole('link', { name: child.identifier, exact: true }),
  ).toBeVisible();
  await screenshots('tasks-detail-return');
  await open(
    page,
    `/issues?q=${encodeURIComponent(`${tag} matching question`)}`,
  );
  await expect(
    page.getByRole('row', { name: new RegExp(parent.identifier) }),
  ).toContainText('Context · outside filter');
  await expect(
    page.getByText('1 tasks · 1 trees', { exact: true }),
  ).toBeVisible();
  await screenshots('tasks-filtered-context');
  await open(page, `/my-issues/owned?q=${encodeURIComponent(tag)}`);
  await expect(page.getByRole('table')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'List', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await screenshots('my-tasks-default-table');
  await open(page, '/my-issues/executing');
  await expect(
    page.getByRole('button', { name: 'List', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await screenshots('my-tasks-executing-empty');
  // Invalid saved values fall back; valid choices and explicit URLs retain their priority.
  await page.evaluate(
    `localStorage.setItem('pm:issues-view:issues','unsupported-view')`,
  );
  await open(page, `/issues?q=${encodeURIComponent(tag)}`);
  await expect(page.getByRole('table')).toBeVisible();
  await page.evaluate(`localStorage.setItem('pm:issues-view:issues','board')`);
  await open(page, `/issues?q=${encodeURIComponent(tag)}`);
  await expect(
    page.getByRole('button', { name: 'Board', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await open(page, `/issues?view=list&q=${encodeURIComponent(tag)}`);
  await expect(page.getByRole('table')).toBeVisible();
  await page.evaluate(
    `localStorage.setItem('pm:issues-view:my-issues','agent')`,
  );
  await open(page, `/my-issues/owned?q=${encodeURIComponent(tag)}`);
  await expect(
    page.getByRole('button', { name: 'Agent queue', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await open(page, `/my-issues/owned?view=list&q=${encodeURIComponent(tag)}`);
  await expect(page.getByRole('table')).toBeVisible();
  // The context refreshes from existing task announcements and stays a single tree when its group changes.
  const latest = await api.get<Task>(`projects/issues/${child.id}`);
  await api.patch(`projects/issues/${child.id}`, {
    revision: latest.revision,
    statusKey: 'in_progress',
  });
  await expect(
    page.getByRole('button', {
      name: 'Collapse Review / acceptance',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Collapse Needs input', exact: true }),
  ).toHaveCount(0);
  await screenshots('tasks-live-regrouping');
  for (const preset of ['compact', 'default'])
    for (const mode of ['light', 'dark']) {
      await api.patch('users/me/preferences', {
        'theme.mode': mode,
        'theme.preset': preset,
      });
      await open(page, `/issues?view=list&q=${encodeURIComponent(tag)}`);
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', preset);
      for (const width of [1440, 375]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
        await screenshots(
          `tasks-${preset}-${mode}-${width === 375 ? 'narrow' : 'desktop'}`,
        );
      }
    }
  await page.setViewportSize({ width: 1440, height: 900 });
  await api.patch('users/me/preferences', {
    'theme.mode': 'light',
    'theme.preset': 'compact',
  });
  await open(page, '/issues?view=list&q=no-matching-hierarchy-test-records');
  await expect(page.getByText('No issues match your filters.')).toBeVisible();
  await screenshots('tasks-no-results');
  await api.delete(`projects/issues/${review.id}`);
  await open(page, `/issues?view=list&deleted=1&q=${encodeURIComponent(tag)}`);
  await expect(
    page.getByRole('button', { name: 'Restore', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Collapse (Needs input|Routine work)/ }),
  ).toHaveCount(0);
  await screenshots('tasks-flat-trash');
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Restore', exact: true }),
  ).toHaveCount(0);
  // Synthetic test records are removed; fixture teardown removes the whole isolated database.
});

test('paginates real children and renders honest root/child error states', async ({
  page,
  api,
}) => {
  mkdirSync(directory, { recursive: true });
  await api.patch('users/me/preferences', {
    locale: 'en-US',
    'theme.mode': 'light',
    'theme.preset': 'compact',
  });
  const tag = `Page tree ${unique()}`;
  const parent = await api.post<Task>('projects/issues', {
    title: tag,
    executor: null,
    start: false,
  });
  for (let i = 0; i < 55; i++)
    await api.post('projects/issues', {
      title: `Child ${i}`,
      parentIssueId: parent.id,
      executor: null,
      start: false,
    });
  await open(page, `/issues?view=list&q=${encodeURIComponent(tag)}`);
  await expect(
    page.getByRole('button', {
      name: `Expand subtasks of ${parent.identifier}`,
      exact: true,
    }),
  ).toBeVisible();
  await page.route('**/api/taskTrees/children*', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          status: 'INTERNAL',
          reason: 'TEST_FAILURE',
          message: 'Test failure',
        },
      }),
    }),
  );
  await page
    .getByRole('button', {
      name: `Expand subtasks of ${parent.identifier}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByText('Could not load subtasks', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(directory, 'tasks-child-error.png'),
    fullPage: true,
  });
  await page.unroute('**/api/taskTrees/children*');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  const more = page.getByRole('button', {
    name: `Load more subtasks of ${parent.identifier}`,
    exact: true,
  });
  await expect(more).toBeVisible();
  await more.click();
  await expect(more).toHaveCount(0);
  await expect(page.getByRole('table').getByRole('link')).toHaveCount(56);
  await page.screenshot({
    path: path.join(directory, 'tasks-cross-page-children.png'),
    fullPage: true,
  });
  const summary = await api.get<TaskTrees>(
    `taskTrees?q=${encodeURIComponent(tag)}`,
  );
  expect(summary.groups[3]!.totals.tasks).toBe(1);
  expect(summary.groups[3]!.data[0]!.progress.total).toBe(55);
  await page.route('**/api/taskTrees*', (route) =>
    route.request().url().includes('/children')
      ? route.continue()
      : route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              status: 'INTERNAL',
              reason: 'TEST_FAILURE',
              message: 'Test failure',
            },
          }),
        }),
  );
  await open(
    page,
    `/issues?view=list&q=${encodeURIComponent(`${tag} failure`)}`,
  );
  await expect(
    page.getByText('Could not load issues.', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(directory, 'tasks-load-error.png'),
    fullPage: true,
  });
  await page.unroute('**/api/taskTrees*');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
});
