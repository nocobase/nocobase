/** Public demo-only evidence for the personal workspace; no routes or upload transports are mocked. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { Locator } from '@playwright/test';

import {
  apiAs,
  expect,
  horizontalOverflow,
  open,
  signIn,
  test,
  unique,
} from '../support/fixtures.ts';
import {
  wheelTo,
  workspaceGeometry,
} from '../support/personal-task-geometry.ts';
import type { Issue } from '../support/runner.ts';
import { STUDIO_ROOT } from '../support/server.ts';

test.use({ user: 'admin', actionTimeout: 10_000 });

for (const preset of ['compact', 'default'] as const) {
  for (const mode of ['light', 'dark'] as const) {
    test(`personal workspace · ${preset} · ${mode} · en-US`, async ({
      page,
      context,
      api,
      browser,
    }, testInfo) => {
      const tag = `Workspace evidence ${unique()}`;
      const account = {
        email: `workspace-evidence-${unique()}@example.com`,
        password: 'workspace-evidence-demo-password',
      };
      await api.post('users', {
        ...account,
        name: 'Workspace Demo Viewer',
        roleScopes: { studio: ['admin'] },
      });
      // Every combination owns its preferences, follows and data. Do not change a shared demo account.
      await signIn(context, account);
      await api.patch('users/me/preferences', {
        locale: 'en-US',
        'theme.mode': mode,
        'theme.preset': preset,
      });
      await page.addInitScript(
        `localStorage.setItem('nocobase.locale','en-US');`,
      );
      const me = await api.get<{ userId: string }>('projects/me');
      const parent = await api.post<Issue>('projects/issues', {
        title: `${tag} · A long readable parent title with enough context to check wrapping, truncation and the compact information menu`,
        ownerUserId: me.userId,
        executor: { type: 'user', id: me.userId },
        start: false,
      });
      const child = await api.post<Issue>('projects/issues', {
        title: `${tag} · Child discussion`,
        parentIssueId: parent.id,
        ownerUserId: me.userId,
        executor: { type: 'user', id: me.userId },
        start: false,
      });
      const oldest = 'Oldest public demo activity';
      await api.post(`projects/issues/${child.id}/comments`, {
        content: oldest,
      });
      for (let index = 0; index < 12; index++) {
        await api.post(`projects/issues/${child.id}/comments`, {
          content: `Public demo update ${index}: ${'Long activity for scrolling and reading. '.repeat(30)}`,
        });
      }
      await api.put('followUps/following', { issueIds: [] });

      const directory = path.resolve(
        STUDIO_ROOT,
        process.env.NB_STUDIO_SCREENSHOT_DIR ?? 'output/screenshots',
        'personal-tasks',
        `en-US-${preset}-${mode}`,
      );
      mkdirSync(directory, { recursive: true });
      const evidence: object[] = [];
      const productHead = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: STUDIO_ROOT,
        encoding: 'utf8',
      }).trim();
      const recordEvidence = () =>
        writeFileSync(
          path.join(directory, 'evidence.json'),
          JSON.stringify(
            {
              productHead,
              runId: process.env.GITHUB_RUN_ID ?? null,
              attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
              test: testInfo.title,
              evidence,
            },
            null,
            2,
          ),
        );
      const capture = async (name: string) => {
        await expect(page.locator('html')).toHaveAttribute(
          'data-theme',
          preset,
        );
        if (mode === 'dark')
          await expect(page.locator('html')).toHaveClass(/\bdark\b/u);
        else await expect(page.locator('html')).not.toHaveClass(/\bdark\b/u);
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
        await page.evaluate('document.fonts.ready.then(() => true)');
        const file = `${name}.png`;
        await page.screenshot({
          path: path.join(directory, file),
          animations: 'disabled',
          caret: 'hide',
        });
        evidence.push({
          file,
          preset,
          mode,
          locale: 'en-US',
          viewport: page.viewportSize(),
          geometry: await workspaceGeometry(
            page.getByTestId('personal-task-workspace'),
          ),
        });
        recordEvidence();
      };
      const row = (issue: Issue) =>
        page.getByRole('row').filter({
          has: page.getByRole('link', { name: issue.identifier, exact: true }),
        });
      // The nested comment timeline shares this English name; select the panel with its composer.
      const activity = page
        .getByRole('region', { name: 'Activity', exact: true })
        .filter({ has: page.getByTestId('issue-composer') });
      const following = page.getByTestId('follow-ups-following');
      const table = page.getByRole('table');
      const openComposer = async () => {
        const composer = activity.getByTestId('issue-composer');
        await expect(composer).toBeVisible();
        if ((await composer.getAttribute('data-folded')) !== null)
          await composer.getByRole('button').click();
        return activity.getByRole('textbox', { name: 'Comment', exact: true });
      };
      const returnByKeyboard = async (target: Locator) => {
        const back = activity.getByRole('button', {
          name: 'Back to the list',
          exact: true,
        });
        await back.focus();
        await page.keyboard.press('Enter');
        await expect(activity).toHaveCount(0);
        await expect(target).toBeVisible();
        await expect(target).toBeFocused();
      };
      const draft =
        'Unsent public demo draft with an actual uploaded attachment';
      const attachment = 'workspace-demo-draft.txt';
      const assertDraft = async (editor: Locator) => {
        await expect(editor).toBeVisible();
        await expect(editor).toBeEditable();
        await expect(editor).toContainText(draft);
        await expect(activity.getByTestId('pending-attachments')).toContainText(
          attachment,
        );
        await expect(
          activity.locator(`[aria-label="Uploading ${attachment}…"]`),
        ).toHaveCount(0);
      };

      await page.setViewportSize({ width: 1600, height: 900 });
      await open(
        page,
        `/my-issues/owned?view=list&q=${encodeURIComponent(tag)}`,
      );
      await expect(table).toBeVisible();
      await expect(row(parent)).toBeVisible();
      // Long plain names must stay inside their own table cells, including the full-width view.
      await expect(
        row(parent).getByText('Workspace Demo Viewer', { exact: true }),
      ).toHaveCount(2);
      expect(
        await row(parent)
          .getByText('Workspace Demo Viewer', { exact: true })
          .evaluateAll(
            (
              elements: {
                getBoundingClientRect(): { width: number };
                parentElement: { clientWidth: number } | null;
              }[],
            ) =>
              elements.every(
                (element) =>
                  element.parentElement !== null &&
                  element.getBoundingClientRect().width <=
                    element.parentElement.clientWidth,
              ),
          ),
      ).toBe(true);
      await expect(following).toHaveCount(0);
      await capture('desktop-zero-following');
      const disclosure = page.getByRole('button', {
        name: `Expand subtasks of ${parent.identifier}`,
        exact: true,
      });
      await disclosure.focus();
      await page.keyboard.press('Enter');
      await expect(
        page.getByRole('link', { name: child.identifier, exact: true }),
      ).toBeVisible();
      await row(parent)
        .getByRole('button', { name: 'Follow', exact: true })
        .click();
      await expect
        .poll(
          async () =>
            (await api.get<{ following: string[] }>('followUps')).following,
        )
        .toEqual([parent.id]);
      const workspace = page.getByTestId('personal-task-workspace');
      await expect
        .poll(() => workspaceGeometry(workspace))
        .toMatchObject({ columns: true, consistent: true });
      await expect(following).toBeVisible();
      await expect(activity).toBeVisible();
      await expect(table).toHaveAttribute('data-compact', 'true');
      await capture('desktop-three-columns');
      const info = row(parent).getByRole('button', {
        name: `Task information: ${parent.identifier}`,
        exact: true,
      });
      await info.focus();
      await page.keyboard.press('Enter');
      const popover = page.locator('[data-slot="popover-content"]');
      await expect(popover).toBeVisible();
      await expect(popover).toBeInViewport({ ratio: 1 });
      await capture('desktop-information-menu');
      await page.keyboard.press('Escape');
      await expect(info).toBeFocused();

      // Incoming children update the expanded real grouped query without replacing the follow set.
      const incoming = await api.post<Issue>('projects/issues', {
        title: `${tag} · Realtime child`,
        parentIssueId: parent.id,
        ownerUserId: me.userId,
        executor: { type: 'user', id: me.userId },
        start: false,
      });
      await expect(
        page.getByRole('link', { name: incoming.identifier, exact: true }),
      ).toBeVisible();
      await api.patch(`projects/issues/${incoming.id}`, {
        revision: incoming.revision,
        statusKey: 'in_review',
      });
      await expect(row(incoming)).toContainText('In review');
      const status = row(incoming).getByText('In review', { exact: true });
      expect(
        await status.evaluate(
          (element: { clientHeight: number; scrollHeight: number }) =>
            element.clientHeight >= element.scrollHeight,
        ),
      ).toBe(true);
      await expect
        .poll(
          async () =>
            (await api.get<{ following: string[] }>('followUps')).following,
        )
        .toEqual([parent.id]);
      await capture('desktop-realtime-child-status');
      const childLink = page.getByRole('link', {
        name: child.identifier,
        exact: true,
      });
      await childLink.focus();
      await page.keyboard.press('Enter');
      await expect(
        activity.getByRole('heading', { name: child.title }).last(),
      ).toBeVisible();
      await wheelTo(
        page,
        activity,
        activity.locator('[data-comment-id]').filter({ hasText: oldest }),
        true,
      );
      await expect(activity.getByTestId('issue-composer')).toBeInViewport({
        ratio: 1,
      });
      await capture('desktop-long-activity');
      const editor = await openComposer();
      await editor.pressSequentially(draft);
      const uploaded = page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/projects/attachments') &&
          response.request().method() === 'POST',
      );
      const chooser = page.waitForEvent('filechooser');
      await activity
        .getByRole('button', { name: 'Attach files', exact: true })
        .click();
      await (
        await chooser
      ).setFiles({
        name: attachment,
        mimeType: 'text/plain',
        buffer: Buffer.from('Public synthetic draft attachment.\n'),
      });
      await expect(activity.getByTestId('pending-attachments')).toContainText(
        attachment,
      );
      expect((await uploaded).ok()).toBe(true);
      await expect(
        activity.getByRole('button', { name: 'Comment', exact: true }),
      ).toBeEnabled();
      await page.getByRole('tab', { name: 'I execute', exact: true }).click();
      await assertDraft(
        activity.getByRole('textbox', { name: 'Comment', exact: true }),
      );
      if (!(await row(child).isVisible())) {
        await page
          .getByRole('button', {
            name: `Expand subtasks of ${parent.identifier}`,
            exact: true,
          })
          .click();
        await expect(row(child)).toBeVisible();
      }
      await row(parent)
        .getByRole('link', { name: parent.identifier, exact: true })
        .click();
      await row(child)
        .getByRole('link', { name: child.identifier, exact: true })
        .click();
      await assertDraft(
        activity.getByRole('textbox', { name: 'Comment', exact: true }),
      );
      const search = page.getByRole('textbox', {
        name: 'Search issues',
        exact: true,
      });
      await search.fill('no matching public demo task');
      await expect(table).toContainText('No issue matches these filters.');
      await expect(following).toBeVisible();
      await assertDraft(
        activity.getByRole('textbox', { name: 'Comment', exact: true }),
      );
      await capture('desktop-no-results-with-following');
      await search.fill(tag);
      await expect(row(parent)).toBeVisible();

      if (!(await row(child).isVisible())) {
        await page
          .getByRole('button', {
            name: `Expand subtasks of ${parent.identifier}`,
            exact: true,
          })
          .click();
        await expect(row(child)).toBeVisible();
      }
      await row(child)
        .getByRole('link', { name: child.identifier, exact: true })
        .click();
      let returnTarget = row(child).getByRole('link', {
        name: child.identifier,
        exact: true,
      });
      const clickedSource = await returnTarget.elementHandle();
      expect(clickedSource).not.toBeNull();
      for (const width of [1320, 375, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await expect
          .poll(() => workspaceGeometry(workspace))
          .toMatchObject({ columns: false, consistent: true });
        if (width === 1320) {
          // Compact-to-full rendering replaces the original link. Return must focus the visible partition.
          await expect
            .poll(() =>
              clickedSource!.evaluate(
                (element: { isConnected: boolean }) => element.isConnected,
              ),
            )
            .toBe(false);
          returnTarget = page
            .getByRole('navigation', { name: 'Personal task sections' })
            .getByRole('button', { name: 'My tasks-α', exact: true });
        }
        await assertDraft(await openComposer());
        await expect(activity.getByTestId('issue-composer')).toBeInViewport({
          ratio: 1,
        });
        await capture(`partition-${width}-detail-and-input`);
        await returnByKeyboard(returnTarget);
        await expect(table).toBeVisible();
        await capture(`partition-${width}-personal-list`);
        await page
          .getByRole('button', { name: /^Return to unsent draft/u })
          .click();
        // The draft entry unmounts while its content is selected; subsequent returns use the active partition.
        returnTarget = page
          .getByRole('navigation', { name: 'Personal task sections' })
          .getByRole('button', { name: 'My tasks-α', exact: true });
        await assertDraft(await openComposer());
      }
      await page.setViewportSize({ width: 1600, height: 900 });
      const stopFollowing = row(parent).getByRole('button', {
        name: 'Following · 1/5',
        exact: true,
      });
      await expect(stopFollowing).toHaveAttribute('aria-pressed', 'true');
      await expect(stopFollowing).toHaveAttribute('title', 'Stop following');
      await stopFollowing.click();
      await expect
        .poll(
          async () =>
            (await api.get<{ following: string[] }>('followUps')).following,
        )
        .toEqual([]);
      await expect(following).toHaveCount(0);
      // An unfollowed preview remains reachable until explicitly returning; its draft is not discarded.
      await activity
        .getByRole('button', { name: 'Back to the list', exact: true })
        .click();
      await expect(table).toBeVisible();
      await expect(table).not.toHaveAttribute('data-compact', 'true');
      await capture('desktop-last-unfollow');
      await page
        .getByRole('button', { name: /^Return to unsent draft/u })
        .click();
      await assertDraft(await openComposer());
      await capture('desktop-restored-draft-attachment');

      recordEvidence();
      // Fixture teardown deletes the throwaway database; only this demo viewer can see these drafts.
      const admin = await apiAs(browser, 'admin');
      try {
        await admin.api.delete(`projects/issues/${incoming.id}`);
        await admin.api.delete(`projects/issues/${child.id}`);
        await admin.api.delete(`projects/issues/${parent.id}`);
      } finally {
        await admin.close();
      }
    });
  }
}
