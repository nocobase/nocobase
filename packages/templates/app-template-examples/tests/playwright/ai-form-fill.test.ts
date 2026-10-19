import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import {
  EXAMPLES_FORM_SCOPE,
  formProposalSchema,
  type FormProposal,
} from '../../shared/ai-form-fill.js';
import { createOnlineAgentModelFixture } from '../fixtures/online-agent-model.js';

const applicationUrl = process.env.APP_URL;
test.skip(
  !applicationUrl || !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
  'Set APP_URL to an isolated built application and E2E_USERNAME/E2E_PASSWORD to its administrator.',
);
test.use({
  viewport: { width: 1440, height: 1000 },
  locale: 'en-US',
  launchOptions: process.env.E2E_BROWSER_PATH
    ? { executablePath: process.env.E2E_BROWSER_PATH }
    : {},
});

const snapshotSchema = z.object({
  kind: z.literal('form'),
  id: z.string(),
  instance: z.string(),
  identity: z.string(),
  revision: z.string(),
});
const sendSchema = z.object({
  context: z.object({
    ui: z.object({ version: z.literal(1), items: z.array(z.unknown()) }),
  }),
});
const proposedValues: FormProposal['values'] = {
  name: 'Proposed browser request',
  priority: 'high',
  budget: 420,
  subscribe: true,
};

async function startScene(page: Page) {
  const app = applicationUrl!.replace(/\/$/, '');
  const fixture = await createOnlineAgentModelFixture({ scene: 'form' });
  const headers = { origin: new URL(app).origin };
  let serviceName: string | undefined;
  const errors: string[] = [];
  const businessWrites: string[] = [];
  const approvals: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Opt-in evidence run only; routine CI remains assertion-only.
  const capture = async (name: string) => {
    if (!process.env.E2E_SCREENSHOT_DIR) return;
    await mkdir(process.env.E2E_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(process.env.E2E_SCREENSHOT_DIR, name),
      fullPage: true,
    });
  };
  const close = async () => {
    if (serviceName)
      await page.request.delete(`${app}/api/agents/services/${serviceName}`, {
        headers,
      });
    await fixture.close();
  };
  try {
    await page.goto(`${app}/login`);
    await page.getByLabel('Username or email').fill(process.env.E2E_USERNAME!);
    await page
      .getByLabel('Password', { exact: true })
      .fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));
    const configured = await page.request.post(`${app}/api/agents/services`, {
      headers,
      data: {
        title: 'Browser form proposal local model',
        provider: 'openai-compatible',
        baseUrl: fixture.url,
        apiKey: 'isolated-local-fixture-only',
        enabled: true,
        models: [{ value: 'fixture-chat', kind: 'chat' }],
      },
    });
    expect(configured.status()).toBe(201);
    serviceName = (await configured.json()).data.name;
    page.on('request', (request) => {
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method()))
        return;
      const pathname = new URL(request.url()).pathname;
      const localePreference =
        request.method() === 'PUT' && pathname.endsWith('/api/i18n/locale');
      if (
        pathname.includes('/api/') &&
        !pathname.includes('/api/agents/') &&
        !localePreference
      )
        businessWrites.push(`${request.method()} ${pathname}`);
      if (pathname.includes('/approval')) approvals.push(pathname);
    });
    await page.goto(`${app}/ai-form-fill`);
    const form = page.getByTestId('ai-form-fill');
    const panel = page.getByTestId('chat-panel');
    await expect(form).toBeVisible();
    await expect(form.getByTestId('include-form')).toHaveCount(0);
    await expect(form.getByTestId('ask-form-agent')).toHaveCount(0);
    const createdResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url() === `${app}/api/agents/conversations`,
    );
    await expect(form.getByTestId('open-form-chat')).toBeEnabled();
    await expect(
      form.locator('[data-slot="card-header"]').getByTestId('open-form-chat'),
    ).toBeVisible();
    await capture('form-chat-icon.png');
    await form.getByTestId('open-form-chat').click();
    const created = await createdResponse;
    expect(created.status()).toBe(201);
    expect(created.request().postDataJSON()).toMatchObject({
      config: { scope: [EXAMPLES_FORM_SCOPE] },
      selectedModel: { modelService: serviceName, model: 'fixture-chat' },
    });
    const conversationId: string = (await created.json()).data.id;
    const endpoint = `${app}/api/agents/conversations/${conversationId}`;
    const url = `${app}/ai-form-fill?chat=${encodeURIComponent(conversationId)}`;
    await expect(panel).toBeVisible();
    expect(fixture.streams).toHaveLength(0);
    await expect(panel.getByTestId('chat-context-chips')).toContainText(
      'Request draft',
    );
    const readDraft = async () => ({
      name: await form.getByTestId('draft-name').inputValue(),
      priority: await form
        .getByTestId('draft-priority')
        .locator('[data-slot="select-value"]')
        .innerText(),
      budget: await form.getByTestId('draft-budget').inputValue(),
      subscribe: await form
        .getByTestId('draft-subscribe')
        .locator('[data-slot="select-value"]')
        .innerText(),
    });
    const sendProposal = async (text: string) => {
      const streamIndex = fixture.streams.length;
      const request = page.waitForRequest(
        (candidate) =>
          candidate.method() === 'POST' &&
          candidate.url() === `${endpoint}/messages`,
      );
      await panel.locator('textarea').fill(text);
      await panel.getByTestId('chat-send').click();
      const sent = sendSchema.parse((await request).postDataJSON());
      const snapshots = sent.context.ui.items
        .map((item) => snapshotSchema.safeParse(item))
        .filter((item) => item.success)
        .map((item) => item.data);
      expect(snapshots).toHaveLength(1);
      const source = snapshots[0]!;
      const proposal = formProposalSchema.parse({
        formId: source.id,
        instance: source.instance,
        identity: source.identity,
        revision: source.revision,
        values: proposedValues,
      });
      await expect.poll(() => fixture.streams.length).toBe(streamIndex + 1);
      expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
        source.instance,
      );
      fixture.formProposal(streamIndex, proposal, `form-${streamIndex}`);
      await expect.poll(() => fixture.streams.length).toBe(streamIndex + 2);
      fixture.append(streamIndex + 1, 'Review this browser-only proposal.');
      fixture.complete(streamIndex + 1);
      await expect
        .poll(
          async () =>
            (await (await page.request.get(endpoint)).json()).data.execution
              ?.status,
        )
        .toBe('idle');
      const card = panel.getByTestId('form-proposal-card').last();
      await expect(card.getByTestId('proposal-name')).toHaveValue(
        proposedValues.name!,
      );
      return { card, proposal, sent };
    };
    return {
      form,
      panel,
      readDraft,
      sendProposal,
      url,
      fixture,
      endpoint,
      errors,
      businessWrites,
      approvals,
      capture,
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}

test('requires review, applies edited values only to the draft, and never reapplies restored history', async ({
  page,
}) => {
  const scene = await startScene(page);
  try {
    const initial = await scene.readDraft();
    await expect(
      scene.form.getByRole('button', {
        name: 'Open AI chat for this form',
        exact: true,
      }),
    ).toBeVisible();
    const first = await scene.sendProposal(
      'Propose a high priority request with a budget.',
    );
    expect(await scene.readDraft()).toEqual(initial);
    await scene.capture('form-proposal-before-apply.png');
    await first.card
      .getByTestId('proposal-name')
      .fill('Reviewed browser request');
    await first.card.getByTestId('proposal-budget').fill('500');
    expect(await scene.readDraft()).toEqual(initial);
    await first.card
      .getByRole('button', { name: 'Apply to draft', exact: true })
      .click();
    await expect(scene.form.getByTestId('draft-name')).toHaveValue(
      'Reviewed browser request',
    );
    await expect(scene.form.getByTestId('draft-budget')).toHaveValue('500');
    await expect(
      scene.form
        .getByTestId('draft-priority')
        .locator('[data-slot="select-value"]'),
    ).toHaveText('High');
    await expect(
      scene.form
        .getByTestId('draft-subscribe')
        .locator('[data-slot="select-value"]'),
    ).toHaveText('Yes');
    await expect(
      first.card.getByRole('heading', { name: 'Suggested draft values' }),
    ).toBeFocused();
    await expect(page.locator('[data-slot="toast-title"]')).toHaveText(
      'Applied to the browser draft. Nothing was saved.',
    );
    const applied = await scene.readDraft();
    await scene.capture('form-proposal-applied-draft.png');
    const second = await scene.sendProposal(
      'Propose another change that I may dismiss.',
    );
    await second.card
      .getByRole('button', { name: 'Dismiss', exact: true })
      .click();
    expect(await scene.readDraft()).toEqual(applied);
    const streams = scene.fixture.streams.length;
    // Reopen durable history after a full reload: cards render, but local values are never applied on mount.
    await page.goto(scene.url);
    await expect(scene.panel.getByTestId('form-proposal-card')).toHaveCount(2);
    expect(await scene.readDraft()).toEqual(initial);
    expect(scene.fixture.streams).toHaveLength(streams);
    const restored = scene.panel.getByTestId('form-proposal-card').first();
    const apply = restored.getByRole('button', {
      name: 'Apply to draft',
      exact: true,
    });
    if (await apply.isEnabled()) await apply.click();
    expect(await scene.readDraft()).toEqual(initial);
    await scene.capture('form-proposal-restored-history.png');
    expect(scene.businessWrites).toEqual([]);
    expect(scene.approvals).toEqual([]);
    expect(scene.errors).toEqual([]);
  } finally {
    await scene.close();
  }
});

test('blocks proposals after manual edits and after record A to B to A target changes', async ({
  page,
}) => {
  const scene = await startScene(page);
  try {
    const first = await scene.sendProposal(
      'Prepare a proposal for the currently selected form.',
    );
    await scene.form
      .getByTestId('draft-name')
      .fill('Manual edit after sending');
    const edited = await scene.readDraft();
    const staleApply = first.card.getByRole('button', {
      name: 'Apply to draft',
      exact: true,
    });
    if (await staleApply.isEnabled()) await staleApply.click();
    expect(await scene.readDraft()).toEqual(edited);
    const second = await scene.sendProposal(
      'Read my latest manual draft and propose again.',
    );
    expect(JSON.stringify(second.sent)).toContain('Manual edit after sending');
    await scene.form.getByTestId('draft-record').click();
    await page.getByRole('option', { name: 'Record B', exact: true }).click();
    await expect(
      scene.form
        .getByTestId('draft-record')
        .locator('[data-slot="select-value"]'),
    ).toHaveText('Record B');
    const oldApply = second.card.getByRole('button', {
      name: 'Apply to draft',
      exact: true,
    });
    // Do not attempt this card in B: the A→B→A guard must work without relying on a cached earlier rejection.
    await scene.form.getByTestId('draft-record').click();
    await page.getByRole('option', { name: 'Record A', exact: true }).click();
    await expect(
      scene.form
        .getByTestId('draft-record')
        .locator('[data-slot="select-value"]'),
    ).toHaveText('Record A');
    const remountedA = await scene.readDraft();
    if (await oldApply.isEnabled()) await oldApply.click();
    expect(await scene.readDraft()).toEqual(remountedA);
    await scene.capture('form-proposal-stale-target.png');
    expect(scene.businessWrites).toEqual([]);
    expect(scene.approvals).toEqual([]);
    expect(scene.errors).toEqual([]);
  } finally {
    await scene.close();
  }
});

test('does not authorize a registered form from a different user message context', async ({
  page,
}) => {
  const scene = await startScene(page);
  try {
    const first = await scene.sendProposal(
      'Read the selected form without applying anything.',
    );
    await first.card.getByTestId('dismiss-form-proposal').click();
    const unchanged = await scene.readDraft();
    // Keep the same live registration and tokens, but explicitly remove it from the next message's selection.
    await scene.panel
      .getByRole('button', {
        name: 'Remove context: Request draft',
        exact: true,
      })
      .click();
    await expect(scene.panel.getByTestId('chat-context-chips')).toHaveCount(0);
    const streamIndex = scene.fixture.streams.length;
    const sentRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' &&
        request.url() === `${scene.endpoint}/messages`,
    );
    await scene.panel
      .locator('textarea')
      .fill('There is no form selected in this message.');
    await scene.panel.getByTestId('chat-send').click();
    const sent = z
      .object({
        context: z
          .object({ ui: z.object({ items: z.array(z.unknown()) }).optional() })
          .optional(),
      })
      .parse((await sentRequest).postDataJSON());
    expect(sent.context?.ui?.items ?? []).toEqual([]);
    await expect.poll(() => scene.fixture.streams.length).toBe(streamIndex + 1);
    // An adversarial model reuses a real, still-live target learned from the previous turn.
    scene.fixture.formProposal(streamIndex, first.proposal, 'unselected-form');
    await expect.poll(() => scene.fixture.streams.length).toBe(streamIndex + 2);
    scene.fixture.complete(streamIndex + 1);
    await expect
      .poll(
        async () =>
          (await (await page.request.get(scene.endpoint)).json()).data.execution
            ?.status,
      )
      .toBe('idle');
    const card = scene.panel.getByTestId('form-proposal-card').last();
    await expect(card.getByTestId('apply-form-proposal')).toBeDisabled();
    await expect(card.getByRole('alert')).toBeVisible();
    expect(await scene.readDraft()).toEqual(unchanged);
    await scene.capture('form-proposal-missing-source.png');
    expect(scene.businessWrites).toEqual([]);
    expect(scene.approvals).toEqual([]);
    expect(scene.errors).toEqual([]);
  } finally {
    await scene.close();
  }
});

test('keeps proposal review and explicit draft application usable at a narrow viewport', async ({
  page,
}) => {
  const scene = await startScene(page);
  try {
    const initial = await scene.readDraft();
    const { card } = await scene.sendProposal(
      'Propose a browser-only draft for mobile review.',
    );
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(card).toBeVisible();
    await card.getByTestId('proposal-name').fill('Reviewed mobile request');
    await card.getByTestId('proposal-budget').fill('650');
    expect(await scene.readDraft()).toEqual(initial);
    await scene.capture('form-proposal-mobile-review.png');
    await card.getByTestId('apply-form-proposal').click();
    await expect(
      card.getByRole('heading', { name: 'Suggested draft values' }),
    ).toBeFocused();
    await expect(card.getByTestId('apply-form-proposal')).toBeDisabled();
    expect(await scene.readDraft()).toMatchObject({
      name: 'Reviewed mobile request',
      budget: '650',
    });
    expect(
      await page.locator('html').evaluate((element) => {
        if (
          !('scrollWidth' in element) ||
          typeof element.scrollWidth !== 'number'
        )
          throw new Error('The document width is unavailable.');
        return element.scrollWidth;
      }),
    ).toBeLessThanOrEqual(375);
    await scene.capture('form-proposal-mobile-applied.png');
    expect(scene.businessWrites).toEqual([]);
    expect(scene.approvals).toEqual([]);
    expect(scene.errors).toEqual([]);
  } finally {
    await scene.close();
  }
});
