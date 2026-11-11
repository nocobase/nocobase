import { renderWithApp, answerApi } from '@nocobase/app-testing/client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import AgentSetup from '../../client/pages/template-portal/agent-setup.js';
import enUS from '../../client/locales/en-US.js';
import metadata from '../../package.json' with { type: 'json' };

afterEach(() => vi.restoreAllMocks());
async function mount(kind: 'nocobase' | 'web', failOnce = false) {
  let requests = 0;
  await renderWithApp(
    <AgentSetup
      app={{
        id: 'external-test',
        name: 'Research lab',
        url: 'https://lab.example/reagents/',
        kind,
      }}
    />,
    {
      namespace: metadata.name,
      namespaces: { [metadata.name]: enUS },
      fetch: answerApi((call) => {
        if (
          call.path !== 'multiApp/externalApps/external-test/configureIdentity'
        )
          throw new Error('Unexpected request');
        requests++;
        if (failOnce && requests === 1)
          return new Response('{}', {
            status: 503,
            headers: { 'content-type': 'application/json' },
          });
        return {
          data: {
            variables: {
              PLATFORM_URL: 'https://platform.example/main/',
              PLATFORM_SSO_ISSUER: 'https://platform.example/main/api/auth',
              PLATFORM_SSO_APP_ID: 'external-test',
              PLATFORM_SSO_CLIENT_ID: 'test-client',
              PLATFORM_SSO_CLIENT_SECRET: 'test-secret',
            },
            callbackUrl: 'https://lab.example/reagents/api/auth/callback/test',
            discoveryUrl:
              'https://platform.example/main/api/auth/.well-known/openid-configuration',
          },
        };
      }),
    },
  );
  return () => requests;
}
it.each(['nocobase', 'web'] as const)(
  'copies complete %s Agent instructions while keeping the preview masked',
  async (kind) => {
    const user = userEvent.setup();
    const count = await mount(kind);
    expect(count()).toBe(0);
    await user.click(
      screen.getByRole('button', { name: enUS.agentSetup.copy }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      enUS.agentSetup.copiedHint,
    );
    const text = await navigator.clipboard.readText();
    expect(text).toContain(enUS.agentSetup.promptGoal);
    expect(text).toContain(enUS.agentSetup.promptVerify);
    expect(text).toContain('test-secret');
    expect(text).toContain('external-test');
    expect(text).toContain(
      'https://lab.example/reagents/api/auth/callback/test',
    );
    expect(text).toContain(
      kind === 'nocobase'
        ? '"APP_BASE_PATH": "/reagents"'
        : '"tokenEndpointAuthMethod": "client_secret_basic"',
    );
    if (kind === 'web') expect(text).not.toContain('"serverEnvironment"');
    await user.click(
      screen.getByRole('button', { name: enUS.agentSetup.view }),
    );
    const preview = await screen.findByText(/```json/);
    expect(preview).toBeVisible();
    expect(preview).toHaveTextContent('••••••••');
    expect(preview).not.toHaveTextContent('test-secret');
    expect(count()).toBe(1);
    await user.click(
      screen.getByRole('button', { name: enUS.agentSetup.hide }),
    );
    await waitFor(() =>
      expect(screen.queryByText(/```json/)).not.toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole('button', { name: enUS.agentSetup.refresh }),
    );
    await waitFor(() => expect(count()).toBe(2));
    expect(
      screen.queryByText(enUS.agentSetup.copiedHint),
    ).not.toBeInTheDocument();
  },
);
it('allows retry after configuration fails without reporting a successful copy', async () => {
  const user = userEvent.setup();
  const count = await mount('nocobase', true);
  await user.click(screen.getByRole('button', { name: enUS.agentSetup.copy }));
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: enUS.agentSetup.copy }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    enUS.agentSetup.copiedHint,
  );
  expect(count()).toBe(2);
});
it('retains prepared instructions when clipboard access fails so a second click can copy', async () => {
  const user = userEvent.setup();
  const count = await mount('nocobase');
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
    new Error('Clipboard unavailable'),
  );
  await user.click(screen.getByRole('button', { name: enUS.agentSetup.copy }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    enUS.agentSetup.copyFailed,
  );
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: enUS.agentSetup.copy }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    enUS.agentSetup.copiedHint,
  );
  expect(count()).toBe(1);
});
