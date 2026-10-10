/**
 * Screenshots of Studio's key pages in every language and colour scheme: zh-CN and en-US, each light and dark, from the
 * throwaway server global setup started. Output: `output/screenshots/<locale>-<mode>/<page>.png` (gitignored), and
 * `<page>.phone.png` for the pages also taken at phone width.
 *
 *   pnpm build && pnpm test:screenshots
 *
 * Environment: NB_STUDIO_SCREENSHOT_DIR (output/screenshots), NB_STUDIO_SCREENSHOT_PAGES (a comma-separated subset of the
 * page names below), NB_STUDIO_SCREENSHOT_THEMES ("zh-CN-light,zh-CN-dark,en-US-light,en-US-dark").
 *
 * The pages are seen as the initial administrator, whom no flow test signs in as, so changing their language and
 * colour scheme here never reaches another test.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import type { BrowserContext, Page } from '@playwright/test';

import { Api, signIn, test, url } from '../support/fixtures.ts';
import { FakeRunner } from '../support/runner.ts';
import { STUDIO_ROOT } from '../support/server.ts';

const outDir = path.resolve(
  STUDIO_ROOT,
  process.env.NB_STUDIO_SCREENSHOT_DIR ?? 'output/screenshots',
);

interface Target {
  readonly name: string;
  /** `{project}`, `{designIssue}` and `{workflow}` are filled in from the data the screenshots set up. */
  readonly path: string;
  /** Also taken at phone width. */
  readonly phone?: boolean;
}

const TARGETS: readonly Target[] = [
  { name: 'inbox', path: '/inbox', phone: true },
  { name: 'dashboard', path: '/dashboard', phone: true },
  { name: 'my-issues', path: '/my-issues' },
  { name: 'issues-list', path: '/issues?view=list', phone: true },
  { name: 'issues-board', path: '/issues?view=board' },
  { name: 'issues-agent-queue', path: '/issues?view=agent', phone: true },
  { name: 'issue', path: '/issues/PM-1', phone: true },
  { name: 'issue-design-proposal', path: '/issues/{designIssue}' },
  { name: 'new-issue-ai', path: '/issues/new' },
  { name: 'projects', path: '/projects' },
  { name: 'project', path: '/projects/{project}' },
  { name: 'project-knowledge', path: '/projects/{project}/knowledge' },
  { name: 'knowledge', path: '/knowledge' },
  { name: 'agents', path: '/agents' },
  { name: 'usage', path: '/usage' },
  { name: 'releases', path: '/releases' },
  { name: 'environments', path: '/environments' },
  { name: 'config-members', path: '/config/members' },
  { name: 'config-roles', path: '/config/roles' },
  { name: 'config-workflow', path: '/config/workflows/{workflow}' },
  { name: 'config-labels', path: '/config/labels' },
  { name: 'config-api-keys', path: '/config/api-keys' },
  { name: 'account-preferences', path: '/account/preferences', phone: true },
];

const only = process.env.NB_STUDIO_SCREENSHOT_PAGES?.split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const targets = only
  ? TARGETS.filter((target) => only.includes(target.name))
  : TARGETS;

const themes = (
  process.env.NB_STUDIO_SCREENSHOT_THEMES ??
  'zh-CN-light,zh-CN-dark,en-US-light,en-US-dark'
)
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const index = entry.lastIndexOf('-');
    return {
      locale: entry.slice(0, index),
      mode: entry.slice(index + 1) as 'light' | 'dark',
    };
  });

/** Where the client keeps the language and colour scheme a browser chose (`client/theme/theme-preferences.ts`). */
const LOCALE_KEY = 'nocobase.locale';
const MODE_KEY = `nocobase:${encodeURIComponent('main')}:theme:color-scheme`;

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  // The tooling tsconfig has no DOM library; the expression runs in the browser.
  await page.evaluate('document.fonts.ready.then(() => true)');
  await page.waitForTimeout(300);
}

async function prepare(
  context: BrowserContext,
  locale: string,
  mode: 'light' | 'dark',
): Promise<void> {
  // A string, since the tooling tsconfig has no DOM library; it runs in the browser before the application.
  await context.addInitScript(
    `localStorage.setItem(${JSON.stringify(LOCALE_KEY)}, ${JSON.stringify(locale)});` +
      `localStorage.setItem(${JSON.stringify(MODE_KEY)}, ${JSON.stringify(mode)});`,
  );
}

const ids: Record<string, string> = {};

test.use({ user: 'admin' });

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  try {
    await signIn(context, 'admin');
    const api = new Api(context.request);
    const me = await api.get<{ userId: string }>('projects/me');
    const projects = await api.get<{ id: string; name: string }[]>('projects');
    const project =
      projects.find((item) => item.name === 'Studio Platform') ?? projects[0];
    ids.project = project?.id ?? '';
    const workflows =
      await api.get<{ id: string; isDefault: boolean }[]>('projects/workflows');
    ids.workflow =
      workflows.find((item) => item.isDefault)?.id ?? workflows[0]?.id ?? '';
    const runner = new FakeRunner(api, 'screenshots');
    // Outside the demo projects: their working directory sends runs to the demo's own runner.
    const issue = await runner.issueWithDesignProposal('流式导出大表', {
      ownerUserId: me.userId,
    });
    ids.designIssue = issue.identifier;
  } finally {
    await context.close();
  }
});

for (const { locale, mode } of themes) {
  test(`${locale} · ${mode}`, async ({ browser, api }) => {
    const dir = path.join(outDir, `${locale}-${mode}`);
    mkdirSync(dir, { recursive: true });
    // The account's preferences win over the browser's (`client/account/preferences-sync.ts`).
    await api.patch('users/me/preferences', { locale, 'theme.mode': mode });

    for (const viewport of [
      { suffix: '', width: 1440, height: 900, phone: false },
      { suffix: '.phone', width: 390, height: 844, phone: true },
    ]) {
      const context = await browser.newContext({
        locale,
        colorScheme: mode,
        viewport: { width: viewport.width, height: viewport.height },
        ...(viewport.phone ? { isMobile: true, hasTouch: true } : {}),
      });
      try {
        await prepare(context, locale, mode);
        const page = await context.newPage();
        if (!viewport.phone) {
          await page.goto(url('/login'));
          await settle(page);
          await page.screenshot({
            path: path.join(dir, 'login.png'),
            animations: 'disabled',
          });
        }
        await signIn(context, 'admin');
        for (const target of targets) {
          if (viewport.phone && !target.phone) continue;
          const address = target.path.replace(
            /\{(\w+)\}/g,
            (_, key: string) => ids[key] ?? '',
          );
          await page.goto(url(address));
          await settle(page);
          await page.screenshot({
            path: path.join(dir, `${target.name}${viewport.suffix}.png`),
            animations: 'disabled',
            caret: 'hide',
          });
        }
      } finally {
        await context.close();
      }
    }
  });
}
