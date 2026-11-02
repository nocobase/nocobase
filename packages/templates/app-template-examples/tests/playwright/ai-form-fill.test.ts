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
  department: 'design',
  quantity: 3,
  budget: 420,
  arrival: '2026-11-06',
  purpose: 'Design work and prototyping',
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
      animations: 'disabled',
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
      'Purchase request',
    );
    const readDraft = async () => ({
      name: await form.getByTestId('draft-name').inputValue(),
      department: await form
        .getByTestId('draft-department')
        .locator('[data-slot="select-value"]')
        .innerText(),
      quantity: await form.getByTestId('draft-quantity').inputValue(),
      budget: await form.getByTestId('draft-budget').inputValue(),
      arrival: await form.getByTestId('draft-arrival').innerText(),
      purpose: await form.getByTestId('draft-purpose').inputValue(),
    });
    const sendProposal = async (
      text: string,
      beforeOutput?: () => Promise<void>,
    ) => {
      const streamIndex = fixture.streams.length;
      const request = page.waitForRequest(
        (candidate) =>
          candidate.method() === 'POST' &&
          candidate.url() === `${endpoint}/messages`,
      );
      await panel
        .getByRole('textbox', { name: 'Message to the agent', exact: true })
        .fill(text);
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
      await beforeOutput?.();
      fixture.formProposal(streamIndex, proposal, `form-${streamIndex}`);
      await expect.poll(() => fixture.streams.length).toBe(streamIndex + 2);
      fixture.append(streamIndex + 1, 'The browser draft values are ready.');
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

test('automatically fills the draft without confirmation and never reapplies restored history', async ({
  page,
}) => {
  const scene = await startScene(page);
  try {
    const initial = await scene.readDraft();
    const first = await scene.sendProposal(
      'Fill a procurement request with quantity, total and delivery date.',
    );
    await expect(scene.form.getByTestId('draft-name')).toHaveValue(
      proposedValues.name!,
    );
    await expect(scene.form.getByTestId('draft-budget')).toHaveValue('420');
    await expect(
      scene.form
        .getByTestId('draft-department')
        .locator('[data-slot="select-value"]'),
    ).toHaveText('Product Design');
    await expect(scene.form.getByTestId('draft-quantity')).toHaveValue('3');
    await expect(scene.form.getByTestId('draft-arrival')).toHaveText(
      'Nov 6, 2026',
    );
    await expect(scene.form.getByTestId('draft-purpose')).toHaveValue(
      proposedValues.purpose!,
    );
    await expect(
      first.card.getByText('Applied to the browser draft. Nothing was saved.'),
    ).toBeVisible();
    await expect(first.card.getByTestId('apply-form-proposal')).toHaveCount(0);
    await expect(first.card.getByTestId('dismiss-form-proposal')).toHaveCount(
      0,
    );
    await scene.capture('form-automatically-filled.png');
    await scene.form
      .getByTestId('draft-name')
      .fill('Edited after automatic filling');
    expect(await scene.readDraft()).toMatchObject({
      name: 'Edited after automatic filling',
    });
    const streams = scene.fixture.streams.length;
    await page.goto(scene.url);
    await expect(scene.panel.getByTestId('form-proposal-card')).toHaveCount(1);
    await expect(scene.form.getByTestId('draft-name')).toHaveValue(
      initial.name,
    );
    expect(await scene.readDraft()).toEqual(initial);
    expect(scene.fixture.streams).toHaveLength(streams);
    await expect(
      scene.panel.getByTestId('form-proposal-card').getByRole('alert'),
    ).toBeVisible();
    await scene.capture('form-proposal-restored-history.png');
    expect(scene.businessWrites).toEqual([]);
    expect(scene.approvals).toEqual([]);
    expect(scene.errors).toEqual([]);
  } finally {
    await scene.close();
  }
});

test('preserves edits made during generation and rejects cleared and restored drafts', async ({
  page,
}) => {
  const scene = await startScene(page);
  try {
    const first = await scene.sendProposal(
      'Fill the selected request.',
      async () => {
        await scene.form
          .getByTestId('draft-name')
          .fill('Manual edit while generating');
      },
    );
    await expect(
      first.card.getByText(
        'The form or draft has changed. Include the current form and generate a new proposal.',
      ),
    ).toBeVisible();
    expect(await scene.readDraft()).toMatchObject({
      name: 'Manual edit while generating',
    });
    const second = await scene.sendProposal(
      'Fill the latest draft.',
      async () => {
        await scene.form
          .getByRole('button', { name: 'Clear form', exact: true })
          .click();
        await scene.form
          .getByTestId('draft-name')
          .fill('Manual edit while generating');
      },
    );
    expect(JSON.stringify(second.sent)).toContain(
      'Manual edit while generating',
    );
    await expect(second.card.getByRole('alert')).toBeVisible();
    expect((await scene.readDraft()).name).not.toBe(proposedValues.name);
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
    const first = await scene.sendProposal('Fill the selected form.');
    await expect(scene.form.getByTestId('draft-name')).toHaveValue(
      proposedValues.name!,
    );
    await scene.form.getByTestId('draft-name').fill('Keep this manual edit');
    const unchanged = await scene.readDraft();
    await scene.panel
      .getByRole('button', {
        name: 'Remove context: Purchase request',
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
      .getByRole('textbox', { name: 'Message to the agent', exact: true })
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
    scene.fixture.formProposal(streamIndex, first.proposal, 'unselected-form');
    await expect.poll(() => scene.fixture.streams.length).toBe(streamIndex + 2);
    scene.fixture.complete(streamIndex + 1);
    const card = scene.panel.getByTestId('form-proposal-card').last();
    await expect(card.getByRole('alert')).toBeVisible();
    await expect(card.getByTestId('apply-form-proposal')).toHaveCount(0);
    expect(await scene.readDraft()).toEqual(unchanged);
    await scene.capture('form-proposal-missing-source.png');
    expect(scene.businessWrites).toEqual([]);
    expect(scene.approvals).toEqual([]);
    expect(scene.errors).toEqual([]);
  } finally {
    await scene.close();
  }
});

test('automatically fills the draft at a narrow viewport and leaves it editable', async ({
  page,
}) => {
  const scene = await startScene(page);
  try {
    await page.setViewportSize({ width: 375, height: 812 });
    const { card } = await scene.sendProposal(
      'Fill the browser draft on mobile.',
    );
    await expect(card).toBeVisible();
    await expect(
      card.getByText('Applied to the browser draft. Nothing was saved.'),
    ).toBeVisible();
    await expect(card.getByTestId('apply-form-proposal')).toHaveCount(0);
    await expect(card.getByTestId('proposal-name')).toBeDisabled();
    expect(await scene.readDraft()).toMatchObject({
      name: proposedValues.name,
      budget: '420',
    });
    await expect
      .poll(() =>
        page.locator('html').evaluate((element) => {
          if (
            !('scrollWidth' in element) ||
            typeof element.scrollWidth !== 'number'
          )
            throw new Error('The document width is unavailable.');
          return element.scrollWidth;
        }),
      )
      .toBeLessThanOrEqual(375);
    await scene.capture('form-automatically-filled-mobile.png');
    expect(scene.businessWrites).toEqual([]);
    expect(scene.approvals).toEqual([]);
    expect(scene.errors).toEqual([]);
  } finally {
    await scene.close();
  }
});

test('keeps extraction side by side and preserves drafts across scenario tabs', async ({
  page,
}) => {
  const scene = await startScene(page);
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${applicationUrl!.replace(/\/$/, '')}/ai-translation`);
    const translationContainer = page
      .getByRole('heading', { name: 'AI Translation', exact: true })
      .locator('xpath=ancestor::section[1]');
    await expect(translationContainer).toBeVisible();
    const translationBox = await translationContainer.boundingBox();
    const translationModel = page.getByRole('combobox', {
      name: 'Language model',
      exact: true,
    });
    await expect(translationModel).toBeVisible();
    const translationModelBox = await translationModel.boundingBox();
    await page.goto(
      `${applicationUrl!.replace(/\/$/, '')}/ai-structured-extraction`,
    );
    const contactTab = page.getByRole('tab', {
      name: 'Contact profile',
      exact: true,
    });
    const orderTab = page.getByRole('tab', {
      name: 'Purchase order',
      exact: true,
    });
    const contact = page.getByRole('region', {
      name: 'Contact profile',
      exact: true,
    });
    const source = contact.getByRole('textbox', {
      name: 'Source text',
      exact: true,
    });
    const result = contact.getByRole('region', {
      name: 'Extracted information',
      exact: true,
    });
    await expect(contactTab).toHaveAttribute('aria-selected', 'true');
    const extractionContainer = page
      .getByRole('heading', { name: 'AI structured extraction', exact: true })
      .locator('xpath=ancestor::section[1]');
    const extractionBox = await extractionContainer.boundingBox();
    expect(extractionBox!.x).toBeCloseTo(translationBox!.x, 0);
    expect(extractionBox!.width).toBeCloseTo(translationBox!.width, 0);
    const extractionModel = contact.getByRole('combobox', {
      name: 'Language model',
      exact: true,
    });
    await expect(extractionModel).toBeVisible();
    await expect(extractionModel).toContainText('fixture-chat');
    const extractionModelBox = await extractionModel.boundingBox();
    expect(extractionModelBox!.width).toBeCloseTo(
      translationModelBox!.width,
      0,
    );
    const sourceBox = await source.boundingBox();
    const resultBox = await result.boundingBox();
    expect(sourceBox!.x + sourceBox!.width).toBeLessThanOrEqual(resultBox!.x);
    const extractButton = contact.getByRole('button', {
      name: 'Extract',
      exact: true,
    });
    await expect(extractButton).toBeEnabled();
    const extractBox = await extractButton.boundingBox();
    expect(extractBox!.x + extractBox!.width).toBeCloseTo(
      sourceBox!.x + sourceBox!.width,
      0,
    );
    await expect(
      page.getByText('No chat models are available.', { exact: true }),
    ).toHaveCount(0);
    await source.fill('Text kept while switching scenarios');
    await contact.getByLabel('Name', { exact: true }).fill('Manual contact');
    await orderTab.click();
    await expect(contact).toBeHidden();
    await contactTab.click();
    await expect(source).toHaveValue('Text kept while switching scenarios');
    await expect(contact.getByLabel('Name', { exact: true })).toHaveValue(
      'Manual contact',
    );
    await expect(
      contact.getByRole('button', { name: 'Use example', exact: true }),
    ).toHaveCount(0);
    await scene.capture('structured-extraction-desktop.png');
    await page.getByRole('button', { name: 'Appearance', exact: true }).hover();
    await page
      .getByRole('radiogroup', { name: 'Color mode' })
      .getByText('Dark', { exact: true })
      .click();
    await page
      .getByRole('radiogroup', { name: 'Theme', exact: true })
      .getByText('Spacious', { exact: true })
      .click();
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'default');
    await scene.capture('structured-extraction-dark-spacious.png');
    await page.getByRole('button', { name: 'Appearance', exact: true }).hover();
    await page
      .getByRole('radiogroup', { name: 'Color mode' })
      .getByText('Light', { exact: true })
      .click();
    await page
      .getByRole('radiogroup', { name: 'Theme', exact: true })
      .getByText('Compact', { exact: true })
      .click();
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'compact');
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(source).toBeVisible();
    const narrowSource = await source.boundingBox();
    const narrowResult = await result.boundingBox();
    expect(narrowSource!.y + narrowSource!.height).toBeLessThan(
      narrowResult!.y,
    );
    await expect
      .poll(() =>
        page.locator('html').evaluate((element) => {
          if (
            !('scrollWidth' in element) ||
            typeof element.scrollWidth !== 'number'
          )
            throw new Error('The document width is unavailable.');
          return element.scrollWidth;
        }),
      )
      .toBeLessThanOrEqual(375);
    await scene.capture('structured-extraction-mobile.png');
    expect(scene.fixture.streams).toHaveLength(0);
    expect(scene.businessWrites).toEqual([]);
    expect(scene.errors).toEqual([]);
  } finally {
    await scene.close();
  }
});
