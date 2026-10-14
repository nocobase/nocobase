import { mkdirSync, writeFileSync } from 'node:fs';
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
  await page.addInitScript(`localStorage.setItem('nocobase.locale','en-US');`);
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await open(page, '/inbox');
  const baselineErrors = [...errors];
  await page.screenshot({
    path: path.join(directory, 'baseline-inbox.png'),
    fullPage: true,
  });
  await page.evaluate(
    `localStorage.removeItem('pm:issues-view:issues'); localStorage.removeItem('pm:issues-view:my-issues');`,
  );
  const tag = `Hierarchy ${unique()}`;
  const parent = await api.post<Task>('projects/issues', {
    title: `${tag} parent context with a long task title that remains readable on hover when the narrow table truncates its title cell`,
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
    needsYou: 'Decide how to unblock the grouped child task.',
  });
  await api.patch(`projects/issues/${review.id}`, {
    revision: review.revision,
    statusKey: 'in_review',
    needsYou: 'Review the completed task and approve it or send feedback.',
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
  await expect(page.getByText(parent.title, { exact: true })).toHaveAttribute(
    'title',
    parent.title,
  );
  const disclosure = page.getByRole('button', {
    name: `Expand subtasks of ${parent.identifier}`,
    exact: true,
  });
  await disclosure.focus();
  await expect(
    page.getByText(`Expand subtasks of ${parent.identifier}`, { exact: true }),
  ).toBeVisible();
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
  const search = page.getByRole('textbox', {
    name: 'Search issues',
    exact: true,
  });
  await search.click();
  await search.press('ControlOrMeta+A');
  await search.press('Backspace');
  await page.keyboard.type(tag);
  await expect(search).toHaveValue(tag);
  await search.press('Home');
  await page.keyboard.type('prefix ');
  await expect(search).toHaveValue(`prefix ${tag}`);
  const ime = await page.context().newCDPSession(page);
  const parentNow = await api.get<Task>(`projects/issues/${parent.id}`);
  const duringComposition = page.waitForResponse(
    (response) =>
      response.url().includes('/api/taskTrees') && response.status() === 200,
  );
  await ime.send('Input.imeSetComposition', {
    text: 'r',
    selectionStart: 1,
    selectionEnd: 1,
  });
  const changed = api.patch(`projects/issues/${parent.id}`, {
    revision: parentNow.revision,
    priority: 'high',
  });
  await ime.send('Input.imeSetComposition', {
    text: 're',
    selectionStart: 2,
    selectionEnd: 2,
  });
  await ime.send('Input.imeSetComposition', {
    text: 'ren',
    selectionStart: 3,
    selectionEnd: 3,
  });
  await Promise.all([changed, duringComposition]);
  await expect(search).toHaveValue(`prefix ren${tag}`);
  await expect(search).toBeFocused();
  await ime.send('Input.insertText', { text: '人' });
  await expect(search).toHaveValue(`prefix 人${tag}`);
  await ime.detach();
  await open(page, `/issues?q=${encodeURIComponent(tag)}`);
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
  // The fixture's demo issues are synthetic and the entire database is removed by teardown.
  for (const identifier of await page
    .getByRole('table')
    .getByRole('link')
    .allTextContents()) {
    const task = await api.get<Task>(`projects/issues/${identifier}`);
    await page.getByRole('link', { name: identifier, exact: true }).focus();
    await api.patch(`projects/issues/${task.id}`, {
      revision: task.revision,
      executor: null,
    });
  }
  await expect(
    page.getByText('You execute no issues', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(
    page.getByRole('textbox', { name: 'Search issues', exact: true }),
  ).toBeFocused();
  await expect(
    page
      .locator('header')
      .getByRole('button', { name: 'New issue', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'New issue', exact: true }),
  ).toHaveCount(1);
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
      if (mode === 'dark')
        await expect(page.locator('html')).toHaveClass(/\bdark\b/);
      else await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
      for (const width of [1440, 375]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
        if (width === 375) {
          const scrolling = await page
            .locator('[data-slot="table-container"]')
            .evaluate((element) => {
              const container = element as unknown as {
                scrollLeft: number;
                scrollWidth: number;
                clientWidth: number;
              };
              container.scrollLeft = 100;
              return {
                overflow: container.scrollWidth > container.clientWidth,
                left: container.scrollLeft,
              };
            });
          expect(scrolling.overflow).toBe(true);
          expect(scrolling.left).toBeGreaterThan(0);
        }
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
  await expect(page.getByText('No issue matches these filters.')).toBeVisible();
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
  const newErrors = errors.filter(
    (message) => !baselineErrors.includes(message),
  );
  writeFileSync(
    path.join(directory, 'browser-check.json'),
    JSON.stringify(
      {
        baselineErrorCount: baselineErrors.length,
        newErrorCount: newErrors.length,
      },
      null,
      2,
    ),
  );
  expect(newErrors).toEqual([]);
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
    page.getByText('Unable to load the issues', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(directory, 'tasks-load-error.png'),
    fullPage: true,
  });
  await page.unroute('**/api/taskTrees*');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
});

test('shows initial loading and retains a coherent table after refresh failure', async ({
  page,
  api,
}) => {
  mkdirSync(directory, { recursive: true });
  await api.patch('users/me/preferences', {
    locale: 'en-US',
    'theme.mode': 'light',
    'theme.preset': 'compact',
  });
  const tag = `Refresh ${unique()}`;
  const issue = await api.post<Task>('projects/issues', {
    title: tag,
    statusKey: 'in_progress',
    executor: null,
    start: false,
  });
  let release = () => {};
  let notify = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    notify = resolve;
  });
  await page.route('**/api/taskTrees*', async (route) => {
    notify();
    await gate;
    await route.continue();
  });
  await page.goto(url(`/issues?view=list&q=${encodeURIComponent(tag)}`), {
    waitUntil: 'domcontentloaded',
  });
  await requested;
  await expect(
    page.getByRole('status', { name: /Loading/i }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'New issue', exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: path.join(directory, 'tasks-initial-loading.png'),
    fullPage: true,
  });
  release();
  await expect(
    page.getByRole('link', { name: issue.identifier, exact: true }),
  ).toBeVisible();
  await page.unroute('**/api/taskTrees*');
  await page.route('**/api/taskTrees*', (route) =>
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
  await api.patch(`projects/issues/${issue.id}`, {
    revision: issue.revision,
    statusKey: 'in_review',
    needsYou: 'Review the completed task and approve it or send feedback.',
  });
  await expect(
    page.getByText(
      'Could not refresh tasks. Showing the last complete result.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: issue.identifier, exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(directory, 'tasks-refresh-error.png'),
    fullPage: true,
  });
  await page.unroute('**/api/taskTrees*');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(
    page.getByRole('button', {
      name: 'Collapse Review / acceptance',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('link', { name: issue.identifier, exact: true }).focus();
  await api.delete(`projects/issues/${issue.id}`);
  await expect(
    page.getByText('No issue matches these filters.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Search issues', exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: path.join(directory, 'tasks-empty-focus-recovery.png'),
    fullPage: true,
  });
});

test('retains genuine empty content during polling failure and recovers with Retry', async ({
  page,
  api,
}) => {
  mkdirSync(directory, { recursive: true });
  await api.patch('users/me/preferences', {
    locale: 'en-US',
    'theme.mode': 'light',
    'theme.preset': 'compact',
  });
  await open(page, '/my-issues/executing?view=list');
  await expect(
    page
      .getByRole('table')
      .or(page.getByText('You execute no issues', { exact: true })),
  ).toBeVisible();
  // These are synthetic fixture assignments; teardown removes the entire database.
  for (const identifier of await page
    .getByRole('table')
    .getByRole('link')
    .allTextContents()) {
    const task = await api.get<Task>(`projects/issues/${identifier}`);
    await api.patch(`projects/issues/${task.id}`, {
      revision: task.revision,
      executor: null,
    });
  }
  await expect(
    page.getByText('You execute no issues', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  // An unfiltered cached empty result still reports a failed polling refresh.
  let releaseEmptyRefresh = () => {};
  const emptyRefreshGate = new Promise<void>((resolve) => {
    releaseEmptyRefresh = resolve;
  });
  await page.route('**/api/taskTrees*', async (route) => {
    await emptyRefreshGate;
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          status: 'INTERNAL',
          reason: 'TEST_FAILURE',
          message: 'Test failure',
        },
      }),
    });
  });
  await expect(
    page.getByText('Refreshing tasks…', { exact: true }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText('You execute no issues', { exact: true }),
  ).toBeVisible();
  releaseEmptyRefresh();
  const refreshError = page.getByText(
    'Could not refresh tasks. Showing the last complete result.',
    { exact: true },
  );
  await expect(refreshError).toBeVisible();
  await expect(
    page.getByText('You execute no issues', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(directory, 'my-tasks-empty-refresh-error.png'),
    fullPage: true,
  });
  await page.unroute('**/api/taskTrees*');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(refreshError).toHaveCount(0);
  await expect(
    page.getByText('Refreshing tasks…', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText('You execute no issues', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.screenshot({
    path: path.join(directory, 'my-tasks-empty-refresh-recovered.png'),
    fullPage: true,
  });
});
