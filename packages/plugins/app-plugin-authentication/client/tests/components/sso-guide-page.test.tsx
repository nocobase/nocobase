import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import enUS from '../../locales/en-US.js';

const settings = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}));

/** The English resources with interpolation, as the plugin's `t` resolves them. */
function translate(key: string, values: Record<string, unknown> = {}): string {
  const text = key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      enUS,
    );
  if (typeof text !== 'string') return key;
  return text.replace(/\{\{(\w+)\}\}/gu, (_match, name: string) =>
    String(values[name]),
  );
}

vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: translate }),
}));
vi.mock('@nocobase/app-client', () => ({
  copyText: () => Promise.resolve(true),
  useClientApplication: () => ({ config: { get: () => 'Acme CRM' } }),
  useToaster: () => ({ show: () => 'toast' }),
}));
vi.mock('../../settings/data.js', () => ({
  useAuthenticationSettings: () => settings.current,
}));

const { default: SsoGuidePage } = await import('../../pages/sso-guide-page.js');

function renderGuide(): void {
  render(
    <MemoryRouter initialEntries={['/settings/authentication/sso?type=social']}>
      <SsoGuidePage />
    </MemoryRouter>,
  );
}

const read = {
  isPending: false,
  refetch: () => undefined,
  data: {
    app: {
      publicOrigin: { value: 'https://crm.example.com' },
      authBaseUrl: 'https://crm.example.com/api/auth',
      authBasePath: '/api/auth',
    },
  },
};

describe('the social sign-in guide', () => {
  it('keeps a built-in provider’s id, so it never writes a key socialProviders refuses', () => {
    settings.current = read;
    renderGuide();
    const id = screen.getByLabelText('Identifier');
    expect(id).toHaveValue('github');
    expect(id).toHaveAttribute('readonly');
    fireEvent.change(id, { target: { value: 'github-work' } });
    expect(id).toHaveValue('github');
    const prompt = screen.getByTestId('agent-prompt');
    expect((prompt as HTMLTextAreaElement).value).toContain("'github': {");
    expect((prompt as HTMLTextAreaElement).value).not.toContain('github-work');
    expect(screen.getByTestId('sso-callback')).toHaveTextContent(
      'https://crm.example.com/api/auth/callback/github',
    );
  });

  it('lets Other take any id, through genericOAuth', () => {
    settings.current = read;
    renderGuide();
    fireEvent.click(screen.getByRole('button', { name: 'Other' }));
    const id = screen.getByLabelText('Identifier');
    expect(id).not.toHaveAttribute('readonly');
    fireEvent.change(id, { target: { value: 'acme-id' } });
    const prompt = (screen.getByTestId('agent-prompt') as HTMLTextAreaElement)
      .value;
    expect(prompt).toContain("providerId: 'acme-id'");
    expect(prompt).not.toContain('socialProviders: {');
    expect(screen.getByTestId('sso-callback')).toHaveTextContent(
      'https://crm.example.com/api/auth/callback/acme-id',
    );
  });

  it('builds no prompt when the settings cannot be read', () => {
    settings.current = { isPending: false, refetch: () => undefined };
    renderGuide();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the authentication settings.',
    );
    expect(screen.queryByTestId('agent-prompt')).toBeNull();
  });
});
