/** Project release UI with persisted preview responses, independent of a live Git host. */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { test, expect, open } from './support/fixtures.ts';
import { STUDIO_ROOT } from './support/server.ts';

for (const locale of ['en-US', 'zh-CN']) {
  for (const mode of ['light', 'dark']) {
    test(`repository previews and cleanup in ${locale} ${mode}`, async ({
      page,
      api,
    }) => {
      // Account preferences override local storage after startup; isolate each visual scenario's values.
      await page.route('**/api/users/me/preferences', (route) =>
        route.fulfill({
          json: { data: { locale, 'theme.mode': mode } },
        }),
      );
      const project = await api.post<{ id: string }>('projects', {
        name: `Repository previews ${locale} ${mode}`,
        visibility: 'everyone',
      });
      const repo =
        'very-long-organization-name/very-long-repository-name-for-preview-cleanup';
      const app = 'long-preview-app-name-for-a-manual-pull-request';
      let live = true;
      let deletes = 0;
      await page
        .context()
        .addInitScript(
          `localStorage.setItem('nocobase.locale', ${JSON.stringify(locale)});` +
            `localStorage.setItem('nocobase:main:theme:color-scheme', ${JSON.stringify(mode)});`,
        );
      await page.route('**/api/deploys/projects/*/unreleasedIssues', (route) =>
        route.fulfill({
          json: {
            data: {
              projectId: project.id,
              hasProduction: false,
              hasPreview: live,
              items: [],
            },
          },
        }),
      );
      await page.route('**/api/deploys/projects/*/environments', (route) =>
        route.fulfill({ json: { data: { projectId: project.id, items: [] } } }),
      );
      await page.route('**/api/previews?*', (route) =>
        route.fulfill({
          json: {
            data: live
              ? [
                  {
                    id: 'manual-preview',
                    resourceId: 'deleted-directory',
                    repo,
                    number: 7,
                    issueId: null,
                    identifier: null,
                    title: null,
                    canDestroy: true,
                    targetAppId: app,
                    targetAppName: app,
                    appId: app,
                    environmentId: 'preview',
                    status: 'ready',
                    url: '/preview/',
                    pullRequest: {
                      repo,
                      number: 7,
                      title:
                        'Long manual pull request title with enough detail to exercise narrow screen truncation',
                      url: 'https://github.com/acme/app/pull/7',
                      state: 'open',
                    },
                    sha: null,
                    deployedSha: null,
                    build: null,
                    releaseId: null,
                    deploymentId: null,
                    error: null,
                    missingVariables: [],
                    runtime: { state: 'running', lastAccessedAt: null },
                    admin: null,
                    updatedAt: '',
                    createdAt: '',
                  },
                ]
              : [],
            meta: { total: live ? 1 : 0 },
          },
        }),
      );
      await page.route('**/api/previews/projects/*/*/down', (route) => {
        deletes++;
        live = false;
        return route.fulfill({
          json: {
            data: { projectId: project.id, previewId: 'manual-preview' },
          },
        });
      });
      const releases = locale === 'zh-CN' ? '发布' : 'Releases';
      const overview = locale === 'zh-CN' ? '概览' : 'Overview';
      const destroy = locale === 'zh-CN' ? '销毁' : 'Destroy';
      const empty = locale === 'zh-CN' ? '暂无预览' : 'No previews';
      const outDir = path.join(
        STUDIO_ROOT,
        'output/screenshots/project-previews',
      );
      mkdirSync(outDir, { recursive: true });
      const consoleErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      try {
        await open(page, '/');
        await expect(page.locator('html')).toHaveClass(new RegExp(mode));
        await page.screenshot({
          animations: 'disabled',
          path: path.join(outDir, `${locale}-${mode}-baseline.png`),
          fullPage: true,
        });
        const baselineErrors = consoleErrors.length;
        await open(page, `/projects/${project.id}/overview`);
        await page.getByRole('tab', { name: releases, exact: true }).click();
        await expect(
          page.getByRole('link', { name: /Long manual pull request/ }),
        ).toBeVisible();
        await page.screenshot({
          animations: 'disabled',
          path: path.join(outDir, `${locale}-${mode}.png`),
          fullPage: true,
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await expect
          .poll(() =>
            page.evaluate(
              'document.documentElement.scrollWidth - window.innerWidth',
            ),
          )
          .toBe(0);
        await page.screenshot({
          animations: 'disabled',
          path: path.join(outDir, `${locale}-${mode}-phone.png`),
          fullPage: true,
        });
        await page
          .getByRole('button', {
            name:
              locale === 'zh-CN'
                ? `${repo} #7 的操作`
                : `Actions for ${repo} #7`,
          })
          .click();
        await page
          .getByRole('menuitem', { name: destroy, exact: true })
          .click();
        await expect(page.getByRole('alertdialog')).toContainText(app);
        await expect
          .poll(() =>
            page.evaluate(
              `(() => { const dialog = document.querySelector('[role="alertdialog"]'); return dialog.scrollWidth - dialog.clientWidth; })()`,
            ),
          )
          .toBe(0);
        await page.screenshot({
          animations: 'disabled',
          path: path.join(outDir, `${locale}-${mode}-confirm.png`),
          fullPage: true,
        });
        await page.getByRole('button', { name: destroy, exact: true }).click();
        await expect(page.getByText(empty, { exact: true })).toBeVisible();
        await expect(page).toHaveURL(
          new RegExp(`/projects/${project.id}/releases$`),
        );
        await expect(
          page.getByRole('tab', { name: releases, exact: true }),
        ).toBeVisible();
        expect(deletes).toBe(1);
        await page.screenshot({
          animations: 'disabled',
          path: path.join(outDir, `${locale}-${mode}-empty.png`),
          fullPage: true,
        });
        await page.getByRole('tab', { name: overview, exact: true }).click();
        await expect(
          page.getByRole('tab', { name: releases, exact: true }),
        ).toHaveCount(0);
        expect(consoleErrors.slice(baselineErrors)).toEqual([]);
      } finally {
        await api.delete(`projects/${project.id}`);
      }
    });
  }
}
