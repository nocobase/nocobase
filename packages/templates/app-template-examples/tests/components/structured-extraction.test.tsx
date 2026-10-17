import { apiClientToken } from '@nocobase/app-client';
import { agentsQueryClient } from '@nocobase/app-plugin-agents/client/chat';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import type { ModelService } from '@nocobase/app-plugin-agents/shared/models';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { OnlineAgentIdentityScope } from '../../client/components/online-agent/identity-scope.js';
import locales from '../../client/locales/index.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import StructuredExtractionPage from '../../client/pages/ai-structured-extraction/index.js';
import {
  contactSchema,
  orderSchema,
  type ContactProfile,
  type PurchaseOrder,
} from '../../client/pages/ai-structured-extraction/schemas.js';
import packageMetadata from '../../package.json' with { type: 'json' };

// Only the session-expired boundary needs an authentication action. API requests,
// authorization checks, translations, toasts and every UI component stay real.
const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('@nocobase/app-plugin-authentication/client', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-authentication/client')
  >()),
  useAuthentication: () => ({ refresh }),
}));

const copy = enUS.structuredExtraction;
const catalog: ModelService[] = [
  {
    name: 'demo-provider',
    title: 'Demo provider',
    provider: 'openai',
    models: [
      { value: 'chat-one', label: 'Chat One', kind: 'chat', dimensions: null },
      {
        value: 'embed-one',
        label: 'Embedding One',
        kind: 'embedding',
        dimensions: 128,
      },
    ],
  },
  {
    name: 'other-provider',
    title: 'Other provider',
    provider: 'openai-compatible',
    models: [
      { value: 'chat-two', label: 'Chat Two', kind: 'chat', dimensions: null },
    ],
  },
];
const contact: ContactProfile = {
  name: 'Alex Chen',
  company: 'Example Studio',
  jobTitle: 'Product manager',
  email: 'alex@example.test',
  phone: '+86 138 0000 0000',
  address: { city: 'Shanghai', country: 'China' },
  skills: ['TypeScript', 'product design'],
};
const order: PurchaseOrder = {
  supplier: 'Example Supplies',
  contact: { name: 'Morgan Lee', email: 'morgan@example.test' },
  currency: 'USD',
  notes: 'Recyclable packaging',
  items: [
    { product: 'Keyboard', quantity: 0, unitPrice: 49.5 },
    { product: 'Monitor', quantity: 2, unitPrice: null },
  ],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const privateMessage = 'PRIVATE upstream token and provider debug details';
function failure(status: number, reason = 'EXTRACTION_FAILED') {
  return Response.json(
    { error: { message: privateMessage, reason } },
    { status },
  );
}

async function mount(
  options: {
    extract?: (call: ApiCall) => unknown;
    models?: () => unknown;
    locale?: string;
    canConfigure?: boolean;
  } = {},
) {
  const calls: ApiCall[] = [];
  const signals: AbortSignal[] = [];
  const answer = answerApi((call) => {
    calls.push(call);
    if (call.path === 'agents/models')
      return options.models?.() ?? { data: catalog };
    if (call.path === 'authorization/permissions') {
      return {
        data: { unrestricted: options.canConfigure ?? false, permissions: [] },
      };
    }
    if (call.path === 'aiStructuredExtraction') {
      return options.extract ? options.extract(call) : { data: contact };
    }
    throw new Error(`Unexpected API call: ${call.method} ${call.path}`);
  });
  const view = await renderWithApp(
    <OnlineAgentIdentityScope>
      <StructuredExtractionPage />
    </OnlineAgentIdentityScope>,
    {
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: locales },
      locale: options.locale ?? 'en-US',
      fetch: (request) => {
        if (new URL(request.url).pathname.endsWith('/aiStructuredExtraction'))
          signals.push(request.signal);
        return answer(request);
      },
      services: (app) => {
        app.container.singleton(
          authorizationClientToken,
          () => new AuthorizationClient(app.container.resolve(apiClientToken)),
        );
      },
    },
  );
  return {
    ...view,
    calls,
    signals,
    extractions: () =>
      calls.filter((call) => call.path === 'aiStructuredExtraction'),
  };
}

function section(title = copy.contactTitle) {
  return screen.getByRole('region', { name: title });
}

async function chooseModel(
  user: ReturnType<typeof userEvent.setup>,
  region: HTMLElement,
  label = 'Demo provider / Chat One',
  modelLabel = copy.model,
) {
  const trigger = within(region).getByRole('combobox', { name: modelLabel });
  await waitFor(() => expect(trigger).toBeEnabled());
  await user.click(trigger);
  expect(
    screen.queryByRole('option', { name: /Embedding One/ }),
  ).not.toBeInTheDocument();
  await user.click(await screen.findByRole('option', { name: label }));
  await waitFor(() => expect(trigger).toHaveTextContent(label));
}

async function replace(
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLElement,
  value: string,
) {
  await user.clear(input);
  if (value) await user.type(input, value);
}

async function extractContact(
  view: Awaited<ReturnType<typeof mount>>,
  user: ReturnType<typeof userEvent.setup>,
) {
  const region = section();
  await chooseModel(user, region);
  await user.click(
    within(region).getByRole('button', { name: copy.extract, exact: true }),
  );
  await waitFor(() =>
    expect(within(region).getByLabelText(copy.fields.name)).toHaveValue(
      contact.name,
    ),
  );
  expect(view.extractions()).toHaveLength(1);
  return region;
}

beforeEach(() => {
  // Standalone page mounts bypass the authenticated provider that normally resets the shared SDK cache.
  agentsQueryClient().clear();
  refresh.mockReset();
});

describe('structured extraction page', () => {
  it('loads the shared catalog and submits two frontend-owned JSON Schemas to the same endpoint', async () => {
    const user = userEvent.setup();
    const view = await mount({
      extract: (call) => {
        const { schema } = call.json as { schema: { properties: object } };
        return { data: 'supplier' in schema.properties ? order : contact };
      },
    });
    expect(screen.getByRole('heading', { name: copy.title })).toBeVisible();
    const contactRegion = section();
    const orderRegion = section(copy.orderTitle);
    for (const region of [contactRegion, orderRegion]) {
      expect(
        within(region).getByRole('button', { name: copy.extract, exact: true }),
      ).toBeDisabled();
      expect(
        within(region).getByRole('textbox', { name: copy.source }),
      ).toHaveAttribute('aria-required', 'true');
    }
    expect(
      within(contactRegion).getByRole('textbox', { name: copy.source }),
    ).toHaveValue(copy.contactSample);
    expect(
      within(orderRegion).getByRole('textbox', { name: copy.source }),
    ).toHaveValue(copy.orderSample);
    await chooseModel(user, contactRegion);
    await replace(
      user,
      within(contactRegion).getByRole('textbox', { name: copy.source }),
      '  Alex from Example Studio  ',
    );
    await user.click(
      within(contactRegion).getByRole('button', {
        name: copy.extract,
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(
        within(contactRegion).getByLabelText(copy.fields.city),
      ).toHaveValue('Shanghai'),
    );
    for (const name of [
      'name',
      'company',
      'jobTitle',
      'email',
      'phone',
    ] as const) {
      expect(
        within(contactRegion).getByLabelText(copy.fields[name]),
      ).toHaveValue(contact[name]);
    }
    expect(
      within(contactRegion).getByLabelText(copy.fields.country),
    ).toHaveValue('China');
    expect(
      within(contactRegion).getByLabelText(copy.fields.skills),
    ).toHaveValue('TypeScript, product design');
    expect(
      within(orderRegion).getByLabelText(copy.fields.supplier),
    ).toHaveValue('');

    await chooseModel(user, orderRegion, 'Other provider / Chat Two');
    await user.click(
      within(orderRegion).getByRole('button', {
        name: copy.extract,
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(
        within(orderRegion).getByLabelText(copy.fields.supplier),
      ).toHaveValue(order.supplier),
    );
    expect(within(orderRegion).getByLabelText(copy.fields.name)).toHaveValue(
      order.contact.name,
    );
    expect(within(orderRegion).getByLabelText(copy.fields.email)).toHaveValue(
      order.contact.email,
    );
    expect(
      within(orderRegion).getByLabelText(copy.fields.currency),
    ).toHaveValue('USD');
    expect(within(orderRegion).getByLabelText(copy.fields.notes)).toHaveValue(
      order.notes,
    );
    expect(
      within(orderRegion)
        .getAllByLabelText(copy.fields.product)
        .map((input) => (input as HTMLInputElement).value),
    ).toEqual(['Keyboard', 'Monitor']);
    expect(within(contactRegion).getByLabelText(copy.fields.name)).toHaveValue(
      contact.name,
    );
    expect(view.calls.filter((call) => call.path === 'agents/models')).toEqual([
      { method: 'GET', path: 'agents/models', query: { kind: 'chat' } },
    ]);
    expect(view.extractions()).toEqual([
      {
        method: 'POST',
        path: 'aiStructuredExtraction',
        json: {
          text: 'Alex from Example Studio',
          model: { modelService: 'demo-provider', model: 'chat-one' },
          schema: z.toJSONSchema(contactSchema, { target: 'draft-7' }),
        },
      },
      {
        method: 'POST',
        path: 'aiStructuredExtraction',
        json: {
          text: copy.orderSample,
          model: { modelService: 'other-provider', model: 'chat-two' },
          schema: z.toJSONSchema(orderSchema, { target: 'draft-7' }),
        },
      },
    ]);
    expect(z.toJSONSchema(contactSchema)).not.toEqual(
      z.toJSONSchema(orderSchema),
    );
    expect(view.toasts()).toEqual([
      expect.objectContaining({ type: 'success', title: copy.success }),
      expect.objectContaining({ type: 'success', title: copy.success }),
    ]);
  });

  it('blocks duplicate clicks and disables only the section with an in-flight extraction', async () => {
    const pending = deferred<unknown>();
    const user = userEvent.setup();
    const view = await mount({
      extract: (call) =>
        (call.json as { model: { model: string } }).model.model === 'chat-one'
          ? pending.promise
          : { data: order },
    });
    const contactRegion = section();
    const orderRegion = section(copy.orderTitle);
    await chooseModel(user, contactRegion);
    await chooseModel(user, orderRegion, 'Other provider / Chat Two');
    await user.dblClick(
      within(contactRegion).getByRole('button', {
        name: copy.extract,
        exact: true,
      }),
    );
    await waitFor(() => expect(view.extractions()).toHaveLength(1));
    expect(
      within(contactRegion).getByRole('button', { name: /Extracting/ }),
    ).toBeDisabled();
    expect(within(contactRegion).getByRole('combobox')).toBeDisabled();
    expect(
      within(contactRegion).getByRole('textbox', { name: copy.source }),
    ).toBeDisabled();
    expect(
      within(contactRegion).getByLabelText(copy.fields.name),
    ).toBeDisabled();
    expect(
      within(orderRegion).getByRole('textbox', { name: copy.source }),
    ).toBeEnabled();
    expect(
      within(orderRegion).getByLabelText(copy.fields.supplier),
    ).toBeEnabled();
    await user.click(
      within(orderRegion).getByRole('button', {
        name: copy.extract,
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(
        within(orderRegion).getByLabelText(copy.fields.supplier),
      ).toHaveValue(order.supplier),
    );
    expect(view.extractions()).toHaveLength(2);
    expect(within(contactRegion).getByLabelText(copy.fields.name)).toHaveValue(
      '',
    );
    await act(async () => {
      pending.resolve({ data: contact });
    });
    await waitFor(() =>
      expect(
        within(contactRegion).getByLabelText(copy.fields.name),
      ).toHaveValue(contact.name),
    );
    expect(
      within(contactRegion).getByRole('button', {
        name: copy.extract,
        exact: true,
      }),
    ).toBeEnabled();
    expect(view.signals[0]?.aborted).toBe(false);
  });

  it('keeps local numeric drafts, zero/null values and comma-separated skills editable without saving', async () => {
    const user = userEvent.setup();
    const view = await mount({
      extract: (call) =>
        (call.json as { model: { model: string } }).model.model === 'chat-one'
          ? { data: contact }
          : { data: order },
    });
    const contactRegion = await extractContact(view, user);
    const skills = within(contactRegion).getByLabelText(copy.fields.skills);
    await replace(user, skills, 'TypeScript, C++, , 中文,');
    expect(skills).toHaveValue('TypeScript, C++, , 中文,');
    const orderRegion = section(copy.orderTitle);
    await chooseModel(user, orderRegion, 'Other provider / Chat Two');
    await user.click(
      within(orderRegion).getByRole('button', {
        name: copy.extract,
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(
        within(orderRegion).getAllByLabelText(copy.fields.quantity),
      ).toHaveLength(2),
    );
    const [quantity] = within(orderRegion).getAllByLabelText(
      copy.fields.quantity,
    );
    const [price, unknownPrice] = within(orderRegion).getAllByLabelText(
      copy.fields.unitPrice,
    );
    expect(quantity).toHaveValue('0');
    expect(price).toHaveValue('49.5');
    expect(unknownPrice).toHaveValue('');
    expect(quantity).toHaveAttribute('inputmode', 'decimal');
    for (const draft of ['-', '0.', '0.00', '', '1e', '12.340']) {
      await replace(user, quantity!, draft);
      await user.tab();
      expect(quantity).toHaveValue(draft);
    }
    await replace(user, unknownPrice!, '0');
    await user.tab();
    expect(unknownPrice).toHaveValue('0');
    expect(skills).toHaveValue('TypeScript, C++, , 中文,');
    expect(view.extractions()).toHaveLength(2);
    expect(
      view.calls.every((call) =>
        ['agents/models', 'aiStructuredExtraction'].includes(call.path),
      ),
    ).toBe(true);
  });

  it.each([
    ['server failure', () => failure(500), copy.requestFailed],
    ['timeout', () => failure(504, 'EXTRACTION_TIMEOUT'), copy.timeout],
    [
      'invalid schema',
      () => failure(400, 'INVALID_SCHEMA'),
      copy.invalidSchema,
    ],
    ['forbidden', () => failure(403), copy.forbidden],
    ['expired session', () => failure(401), copy.sessionExpired],
    [
      'invalid output',
      () => ({ data: { ...contact, name: 42 } }),
      copy.requestFailed,
    ],
    [
      'extra output property',
      () => ({ data: { ...contact, unexpected: 'not in the form schema' } }),
      copy.requestFailed,
    ],
  ] as const)(
    'preserves manually edited results and source after %s, without exposing provider details',
    async (_name, response, message) => {
      const user = userEvent.setup();
      let attempts = 0;
      const view = await mount({
        extract: () => (++attempts === 1 ? { data: contact } : response()),
      });
      const region = await extractContact(view, user);
      await replace(
        user,
        within(region).getByLabelText(copy.fields.name),
        'Manually corrected name',
      );
      await replace(
        user,
        within(region).getByLabelText(copy.fields.city),
        'Manually corrected city',
      );
      const source = within(region).getByRole('textbox', { name: copy.source });
      await replace(user, source, 'A new source kept after the failed request');
      await user.click(
        within(region).getByRole('button', { name: copy.extract, exact: true }),
      );
      expect(await within(region).findByRole('alert')).toHaveTextContent(
        message,
      );
      expect(within(region).getByLabelText(copy.fields.name)).toHaveValue(
        'Manually corrected name',
      );
      expect(within(region).getByLabelText(copy.fields.city)).toHaveValue(
        'Manually corrected city',
      );
      expect(source).toHaveValue('A new source kept after the failed request');
      expect(source).toBeEnabled();
      expect(document.body).not.toHaveTextContent(privateMessage);
      expect(
        within(section(copy.orderTitle)).queryByRole('alert'),
      ).not.toBeInTheDocument();
      expect(view.extractions()).toHaveLength(2);
      expect(view.toasts()).toHaveLength(1);
      if (message === copy.sessionExpired) {
        await user.click(
          within(region).getByRole('button', { name: copy.signIn }),
        );
        expect(refresh).toHaveBeenCalledTimes(1);
      }
    },
  );

  it('replaces contact edits even when successful extractions return identical values', async () => {
    const user = userEvent.setup();
    const view = await mount({ extract: () => ({ data: contact }) });
    const region = section(copy.contactTitle);
    await chooseModel(user, region);
    const submit = within(region).getByRole('button', {
      name: copy.extract,
      exact: true,
    });
    await user.click(submit);
    const name = within(region).getByLabelText(copy.fields.name);
    await waitFor(() => expect(name).toHaveValue(contact.name));
    await replace(user, name, 'Manual correction');
    await replace(
      user,
      within(region).getByLabelText(copy.fields.city),
      'Changed city',
    );
    await user.click(submit);
    await waitFor(() => expect(name).toHaveValue(contact.name));
    expect(within(region).getByLabelText(copy.fields.city)).toHaveValue(
      contact.address.city,
    );
    expect(view.extractions()).toHaveLength(2);
  });

  it('validates an order against its own schema, preserves edits on invalid output, and replaces them only on a valid re-extraction', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    const replacement: PurchaseOrder = {
      ...order,
      supplier: 'Replacement supplier',
      items: [{ product: 'Replacement item', quantity: null, unitPrice: 0 }],
    };
    const view = await mount({
      extract: () => {
        attempts += 1;
        // A valid contact is still not a valid purchase order.
        return {
          data: attempts === 1 ? order : attempts === 2 ? contact : replacement,
        };
      },
    });
    const region = section(copy.orderTitle);
    await chooseModel(user, region);
    const submit = within(region).getByRole('button', {
      name: copy.extract,
      exact: true,
    });
    await user.click(submit);
    await waitFor(() =>
      expect(within(region).getByLabelText(copy.fields.supplier)).toHaveValue(
        order.supplier,
      ),
    );
    await replace(
      user,
      within(region).getByLabelText(copy.fields.supplier),
      'Locally corrected supplier',
    );
    await replace(
      user,
      within(region).getAllByLabelText(copy.fields.quantity)[0]!,
      '0.',
    );
    const source = within(region).getByRole('textbox', { name: copy.source });
    await replace(user, source, 'Source is not overwritten by a response');
    await user.click(submit);
    expect(await within(region).findByRole('alert')).toHaveTextContent(
      copy.requestFailed,
    );
    expect(within(region).getByLabelText(copy.fields.supplier)).toHaveValue(
      'Locally corrected supplier',
    );
    expect(
      within(region).getAllByLabelText(copy.fields.quantity)[0],
    ).toHaveValue('0.');
    expect(view.toasts()).toHaveLength(1);
    await user.click(submit);
    await waitFor(() =>
      expect(within(region).getByLabelText(copy.fields.supplier)).toHaveValue(
        'Replacement supplier',
      ),
    );
    expect(within(region).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(region).getAllByLabelText(copy.fields.product)).toHaveLength(
      1,
    );
    expect(within(region).getByLabelText(copy.fields.product)).toHaveValue(
      'Replacement item',
    );
    expect(within(region).getByLabelText(copy.fields.quantity)).toHaveValue('');
    expect(within(region).getByLabelText(copy.fields.unitPrice)).toHaveValue(
      '0',
    );
    expect(source).toHaveValue('Source is not overwritten by a response');
    expect(view.extractions()).toHaveLength(3);
    expect(view.toasts()).toHaveLength(2);
    await replace(
      user,
      within(region).getByLabelText(copy.fields.supplier),
      'Edited again',
    );
    await replace(
      user,
      within(region).getByLabelText(copy.fields.quantity),
      '0.',
    );
    await user.click(submit);
    await waitFor(() =>
      expect(within(region).getByLabelText(copy.fields.supplier)).toHaveValue(
        'Replacement supplier',
      ),
    );
    expect(within(region).getByLabelText(copy.fields.quantity)).toHaveValue('');
    expect(view.extractions()).toHaveLength(4);
    expect(view.toasts()).toHaveLength(3);
  });

  it.each([
    ['INVALID_TEXT', copy.invalidText, 'textbox'],
    ['INVALID_MODEL', copy.invalidModel, 'combobox'],
  ] as const)(
    'focuses the input for %s and preserves the previous local result',
    async (reason, message, role) => {
      const user = userEvent.setup();
      let attempts = 0;
      const view = await mount({
        extract: () =>
          ++attempts === 1 ? { data: contact } : failure(400, reason),
      });
      const region = await extractContact(view, user);
      await replace(
        user,
        within(region).getByLabelText(copy.fields.name),
        'Local correction',
      );
      await user.click(
        within(region).getByRole('button', { name: copy.extract, exact: true }),
      );
      expect(await within(region).findByText(message)).toBeVisible();
      const input = within(region).getByRole(role, {
        name: role === 'textbox' ? copy.source : copy.model,
      });
      await waitFor(() => expect(input).toHaveFocus());
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(within(region).getByLabelText(copy.fields.name)).toHaveValue(
        'Local correction',
      );
      expect(view.toasts()).toHaveLength(1);
    },
  );

  it('requires nonblank source text, rejects overlong input with focus, and accepts the exact length limit', async () => {
    const user = userEvent.setup();
    const view = await mount();
    const region = section();
    await chooseModel(user, region);
    const source = within(region).getByRole('textbox', { name: copy.source });
    const button = within(region).getByRole('button', {
      name: copy.extract,
      exact: true,
    });
    await replace(user, source, '   ');
    expect(button).toBeDisabled();
    expect(view.extractions()).toHaveLength(0);
    // Paste is a real input event without 20,001 individual keyboard events.
    await user.clear(source);
    await user.paste('x'.repeat(20_001));
    await user.click(button);
    expect(await within(region).findByText(copy.textTooLong)).toBeVisible();
    await waitFor(() => expect(source).toHaveFocus());
    expect(source).toHaveAttribute('aria-invalid', 'true');
    expect(view.extractions()).toHaveLength(0);
    await user.clear(source);
    await user.paste('x'.repeat(20_000));
    await user.click(button);
    await waitFor(() => expect(view.toasts()).toHaveLength(1));
    expect(view.extractions()).toHaveLength(1);
    expect((view.extractions()[0]?.json as { text: string }).text).toHaveLength(
      20_000,
    );
  });

  it('renders and extracts with the real Chinese labels, samples, nested fields and toast', async () => {
    const user = userEvent.setup();
    const view = await mount({ locale: 'zh-CN' });
    const chinese = zhCN.structuredExtraction;
    expect(screen.getByRole('heading', { name: chinese.title })).toBeVisible();
    const region = section(chinese.contactTitle);
    expect(
      within(region).getByRole('textbox', { name: chinese.source }),
    ).toHaveValue(chinese.contactSample);
    expect(
      within(section(chinese.orderTitle)).getByRole('textbox', {
        name: chinese.source,
      }),
    ).toHaveValue(chinese.orderSample);
    expect(within(region).getByLabelText(chinese.fields.skills)).toBeVisible();
    await chooseModel(user, region, 'Demo provider / Chat One', chinese.model);
    await user.click(
      within(region).getByRole('button', {
        name: chinese.extract,
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(within(region).getByLabelText(chinese.fields.city)).toHaveValue(
        'Shanghai',
      ),
    );
    expect(view.extractions()[0]?.json).toMatchObject({
      text: chinese.contactSample,
    });
    expect(view.toasts()).toEqual([
      expect.objectContaining({ title: chinese.success, type: 'success' }),
    ]);
  });

  it.each(['success', 'failure'] as const)(
    'aborts on unmount and ignores a late %s without a stale toast',
    async (outcome) => {
      const pending = deferred<unknown>();
      const user = userEvent.setup();
      const view = await mount({ extract: () => pending.promise });
      const region = section();
      await chooseModel(user, region);
      await user.click(
        within(region).getByRole('button', { name: copy.extract, exact: true }),
      );
      await waitFor(() => expect(view.extractions()).toHaveLength(1));
      expect(view.signals[0]?.aborted).toBe(false);
      view.unmount();
      expect(view.signals[0]?.aborted).toBe(true);
      // The fetch fixture deliberately ignores abort so the page must also guard late work.
      await act(async () => {
        pending.resolve(
          outcome === 'success' ? { data: contact } : failure(500),
        );
      });
      expect(view.toasts()).toEqual([]);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );

  it('keeps both sections disabled while the catalog loads, then enables model selection without auto-submitting', async () => {
    const pending = deferred<unknown>();
    const view = await mount({ models: () => pending.promise });
    expect(
      screen.getAllByRole('status', { name: enUS['status.loading'] }),
    ).toHaveLength(2);
    for (const title of [copy.contactTitle, copy.orderTitle]) {
      expect(within(section(title)).getByRole('combobox')).toBeDisabled();
      expect(
        within(section(title)).getByRole('button', {
          name: copy.extract,
          exact: true,
        }),
      ).toBeDisabled();
    }
    await act(async () => {
      pending.resolve({ data: catalog });
    });
    await waitFor(() =>
      expect(within(section()).getByRole('combobox')).toBeEnabled(),
    );
    expect(
      within(section()).getByRole('button', {
        name: copy.extract,
        exact: true,
      }),
    ).toBeDisabled();
    expect(view.extractions()).toHaveLength(0);
  });

  it.each([true, false])(
    'handles an empty chat catalog with real model-configuration authorization (%s)',
    async (canConfigure) => {
      const view = await mount({
        models: () => ({
          data: [
            {
              ...catalog[0]!,
              models: catalog[0]!.models.filter(
                (model) => model.kind === 'embedding',
              ),
            },
          ],
        }),
        canConfigure,
      });
      await waitFor(() =>
        expect(screen.getAllByText(copy.noModels)).toHaveLength(2),
      );
      for (const title of [copy.contactTitle, copy.orderTitle]) {
        const region = section(title);
        expect(within(region).getByRole('combobox')).toBeDisabled();
        expect(
          within(region).getByRole('button', {
            name: copy.extract,
            exact: true,
          }),
        ).toBeDisabled();
        if (canConfigure) {
          expect(
            await within(region).findByRole('button', {
              name: enUS.onlineAgent.openModels,
            }),
          ).toHaveAttribute('href', '/models');
        } else {
          expect(
            await within(region).findByText(enUS.onlineAgent.noModels.readOnly),
          ).toBeVisible();
          expect(
            within(region).queryByRole('button', {
              name: enUS.onlineAgent.openModels,
            }),
          ).not.toBeInTheDocument();
        }
      }
      expect(view.calls).toContainEqual({
        path: 'authorization/permissions',
        method: 'GET',
      });
      expect(view.extractions()).toHaveLength(0);
    },
  );

  it('retries a failed shared catalog explicitly and does not expose server details', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    const view = await mount({
      models: () => (++attempts === 1 ? failure(500) : { data: catalog }),
    });
    expect(await within(section()).findByRole('alert')).toHaveTextContent(
      copy.catalogFailed,
    );
    expect(
      within(section(copy.orderTitle)).getByRole('alert'),
    ).toHaveTextContent(copy.catalogFailed);
    expect(document.body).not.toHaveTextContent(privateMessage);
    await user.click(
      within(section()).getByRole('button', { name: copy.retry }),
    );
    await waitFor(() =>
      expect(within(section()).getByRole('combobox')).toBeEnabled(),
    );
    expect(
      within(section(copy.orderTitle)).getByRole('combobox'),
    ).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      view.calls.filter((call) => call.path === 'agents/models'),
    ).toHaveLength(2);
    expect(view.extractions()).toHaveLength(0);
  });

  it.each([401, 403])(
    'handles catalog HTTP %s without offering an inappropriate retry',
    async (status) => {
      const user = userEvent.setup();
      const view = await mount({ models: () => failure(status) });
      const region = section();
      expect(await within(region).findByRole('alert')).toHaveTextContent(
        status === 401 ? copy.sessionExpired : copy.forbidden,
      );
      expect(
        within(region).queryByRole('button', { name: copy.retry }),
      ).not.toBeInTheDocument();
      expect(within(region).getByRole('combobox')).toBeDisabled();
      if (status === 401) {
        await user.click(
          within(region).getByRole('button', { name: copy.signIn }),
        );
        expect(refresh).toHaveBeenCalledTimes(1);
      } else {
        expect(
          within(region).queryByRole('button', { name: copy.signIn }),
        ).not.toBeInTheDocument();
      }
      expect(view.extractions()).toHaveLength(0);
    },
  );
});
