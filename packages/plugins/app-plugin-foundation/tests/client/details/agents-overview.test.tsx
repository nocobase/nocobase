import agents from '@nocobase/app-plugin-agents/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AgentsOverview from '../../../client/capability-guide/details/agents-overview.js';
import enUS from '../../../client/locales/en-US.js';
import packageMetadata from '../../../package.json' with { type: 'json' };

function mount(answer: (call: ApiCall) => unknown, registered = false) {
  return renderWithApp(<AgentsOverview />, {
    route: '/capabilities/app-plugin-agents',
    plugins: registered ? [agents()] : [],
    namespace: '@nocobase/app-plugin-foundation',
    namespaces: { [packageMetadata.name]: enUS },
    fetch: answerApi((call) => {
      expect(call.path).toBe('foundation/registrations');
      expect(call.method).toBe('GET');
      return answer(call);
    }),
  });
}

it.each([
  [false, false, 'Not configured'],
  [true, false, 'Configuration incomplete'],
  [false, true, 'Configuration incomplete'],
  [true, true, 'Configured'],
] as const)(
  'summarizes integration as one application status (%s, %s)',
  async (client, server, label) => {
    await mount(
      () => ({
        data: { serverPlugins: server ? ['@nocobase/app-plugin-agents'] : [] },
      }),
      client,
    );
    const status = screen.getByRole('region', { name: 'This application' });
    expect(await within(status).findByText(label)).toBeInTheDocument();
    expect(within(status).queryByRole('definition')).not.toBeInTheDocument();
    for (const oldLabel of [
      'Application dependency',
      'Browser plugin',
      'Server plugin',
    ]) {
      expect(screen.queryByText(oldLabel)).not.toBeInTheDocument();
    }
    if (client && server)
      expect(status).toHaveTextContent(
        'still depends on the configured models',
      );
  },
);

it('keeps registration unknown until the server answers, including unavailable host facts', async () => {
  let resolve!: (value: unknown) => void;
  const pending = new Promise((done) => {
    resolve = done;
  });
  await mount(() => pending);
  expect(
    screen.queryByText(/AI agent capabilities have not been configured/),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh status' })).toBeDisabled();
  resolve({ data: { serverPlugins: null } });
  expect(
    await screen.findByText(/The current configuration status is unavailable/),
  ).toBeInTheDocument();
  expect(screen.getByText('Unable to confirm')).toBeInTheDocument();
});

it('retries a failed read and updates registration facts', async () => {
  const user = userEvent.setup();
  let attempt = 0;
  await mount(() =>
    ++attempt === 1
      ? new Response(null, { status: 503 })
      : { data: { serverPlugins: [] } },
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to read configuration status',
  );
  expect(
    screen.queryByText(/AI agent capabilities have not been configured/),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Refresh status' }));
  expect(
    await screen.findByText(/AI agent capabilities have not been configured/),
  ).toBeInTheDocument();
});

it.each([401, 403])(
  'does not infer disabled status from a denied read (%s)',
  async (status) => {
    await mount(() => new Response(null, { status }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      status === 401 ? 'Sign in again' : 'cannot read configuration status',
    );
    expect(screen.getByText('Unable to confirm')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Refresh status' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/AI agent capabilities have not been configured/),
    ).not.toBeInTheDocument();
    if (status === 401)
      expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
        'href',
        '/login',
      );
  },
);

it('keeps separate editable requests across tabs and expansion, and copies only the displayed draft', async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  await mount(() => ({ data: { serverPlugins: [] } }));
  await user.click(
    screen.getByRole('button', { name: 'Set up AI conversations' }),
  );
  const request = screen.getByRole('textbox', { name: 'Editable request' });
  expect((request as HTMLTextAreaElement).value).toContain(
    'each person’s conversation history',
  );
  await user.clear(request);
  await user.type(request, 'Help our sales team');
  await user.click(screen.getByRole('tab', { name: 'Setup steps' }));
  expect(
    screen.getByText(/embedding and rerank models are not chat models/),
  ).toBeVisible();
  await user.click(screen.getByRole('tab', { name: 'Development request' }));
  await user.click(screen.getByRole('button', { name: 'Copy request' }));
  expect(await screen.findByText('Copied')).toBeInTheDocument();
  expect(write).toHaveBeenCalledWith('Help our sales team');
  await user.type(request, ' today');
  expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  const toggle = screen.getByRole('button', {
    name: 'Set up AI conversations',
  });
  await user.click(toggle);
  await user.click(toggle);
  expect(request).toHaveValue('Help our sales team today');
  await user.click(toggle);
  await user.click(
    screen.getByRole('button', { name: 'Set up a machine agent' }),
  );
  const runnerRequest = screen.getByRole('textbox', {
    name: 'Editable request',
  });
  expect((runnerRequest as HTMLTextAreaElement).value).toContain(
    'Connect a coding assistant',
  );
  await user.click(screen.getByRole('tab', { name: 'Setup steps' }));
  expect(
    screen.getByText(
      /An online machine alone does not mean an agent is enabled/,
    ),
  ).toBeVisible();
});

it('offers manual copying on clipboard failure and labels configuration as guidance', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('Denied'),
  );
  await mount(() => ({ data: { serverPlugins: [] } }));
  await user.click(
    screen.getByRole('button', { name: 'Set up a machine agent' }),
  );
  await user.click(screen.getByRole('button', { name: 'Copy request' }));
  expect(await screen.findByText(/Copy failed/)).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', {
      name: 'Where to manage models, Skills and usage',
    }),
  );
  expect(
    screen.getByText(/not what has already been configured here/),
  ).toBeVisible();
  const configuration = screen.getByText(
    /not what has already been configured here/,
  ).parentElement!;
  expect(
    within(configuration).getByText(
      /Model services are not configured under agents in config.yml/,
    ),
  ).toBeVisible();
});

it('explains business Skills and keeps their request separate from model and machine setup', async () => {
  const user = userEvent.setup();
  await mount(() => ({ data: { serverPlugins: [] } }));
  expect(screen.getByText('Business Skills')).toBeInTheDocument();
  expect(screen.getByText('Usage and pricing')).toBeInTheDocument();
  expect(
    screen.getByText(/Model conversations do not directly read/),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Machine agents use the coding tool’s own credentials/),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Set up a business Skill' }),
  );
  expect(
    (
      screen.getByRole('textbox', {
        name: 'Editable request',
      }) as HTMLTextAreaElement
    ).value,
  ).toContain('explicitly selects it for the conversation');
  expect(
    within(screen.getByRole('tabpanel')).getByText(
      /It is not a message for a business conversation/,
    ),
  ).toBeVisible();
  await user.click(screen.getByRole('tab', { name: 'Setup steps' }));
  expect(
    screen.getByText(/Opening an ordinary chat does not automatically select/),
  ).toBeVisible();
  expect(screen.getByText(/inspect the tool record/)).toBeVisible();
});
