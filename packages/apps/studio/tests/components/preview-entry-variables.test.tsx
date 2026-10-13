/**
 * A pull request's preview on the issue page whose build needs variables: what it misses, the inline form an editor
 * saves them with (to this preview, or to the Preview environment when allowed), and a build's new variables.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IssuePreviews, PreviewView } from '../../shared/previews.js';

const request = vi.fn();

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request }),
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.names ? `${key}(${String(options.names)})` : key,
    i18n: { language: 'en-US' },
  }),
}));
vi.mock('../../client/access/notify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
  errorText: () => 'failed',
}));

const { PreviewEntry } = await import('../../client/previews/preview-entry.js');

const PREVIEW: PreviewView = {
  id: 'pv1',
  resourceId: 'r1',
  targetAppId: 'web',
  targetAppName: 'Web',
  appId: 'web-pr-12',
  environmentId: 'preview',
  status: 'blocked',
  url: null,
  pullRequest: {
    repo: 'acme/shop',
    number: 12,
    url: 'https://github.com/acme/shop/pull/12',
    title: 'Mail',
    state: 'open',
  },
  sha: 'a'.repeat(40),
  deployedSha: null,
  build: {
    id: 'b1',
    appId: 'web-pr-12',
    sha: 'a'.repeat(40),
    purpose: 'preview',
    ref: null,
    state: 'succeeded',
    logsUrl: null,
    message: null,
    superseded: false,
    releaseId: 'r1',
    uploadedAt: null,
    newVariables: {
      added: [
        {
          name: 'SMTP_PASSWORD',
          description: 'The SMTP password.',
          required: true,
          secret: true,
        },
      ],
      removed: [],
    },
    updatedAt: '2026-10-06T00:00:00.000Z',
  },
  releaseId: 'r1',
  deploymentId: null,
  error: 'A required variable is not set.',
  missingVariables: [
    { name: 'SMTP_PASSWORD', description: 'The SMTP password.', secret: true },
    { name: 'SMTP_HOST', description: null, secret: false },
  ],
  runtime: null,
  admin: null,
  updatedAt: '2026-10-06T00:00:00.000Z',
  createdAt: '2026-10-06T00:00:00.000Z',
};

function previews(overrides: Partial<IssuePreviews> = {}): IssuePreviews {
  return {
    issueId: 'i1',
    identifier: 'PM-1',
    previews: [PREVIEW],
    blocker: null,
    canEdit: true,
    canSetEnvironmentVariables: false,
    ...overrides,
  };
}

function show(state: IssuePreviews) {
  // Every call (the save and the read after it) answers the issue's previews.
  request.mockImplementation(() => Promise.resolve({ data: state }));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ul>
          <PreviewEntry
            issue={{ id: 'i1' }}
            preview={PREVIEW}
            canEdit={state.canEdit}
            canSetEnvironment={state.canSetEnvironmentVariables}
            onChanged={() => undefined}
          />
        </ul>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  request.mockReset();
});

describe('a blocked preview', () => {
  it('asks an editor for each missing value, a secret masked, and saves only what was filled', async () => {
    show(previews());
    const secret = await screen.findByLabelText('SMTP_PASSWORD');
    expect(secret.getAttribute('type')).toBe('password');
    expect(screen.getByLabelText('SMTP_HOST').getAttribute('type')).toBe(
      'text',
    );
    expect(screen.getByText('The SMTP password.')).toBeTruthy();
    // Without the environment permission there is nothing to choose.
    expect(
      screen.queryByText('previews.variables.scopeEnvironment'),
    ).toBeNull();
    // Where else it is set: the preview's own App; the environment only for who may set it.
    expect(
      document
        .querySelector('[data-variables-link="app"]')
        ?.getAttribute('href'),
    ).toBe('/releases/web-pr-12?tab=variables');
    expect(
      document.querySelector('[data-variables-link="environment"]'),
    ).toBeNull();
    expect(
      screen.getByText('previews.variables.added(SMTP_PASSWORD)'),
    ).toBeTruthy();
    fireEvent.change(secret, { target: { value: 's3cret' } });
    fireEvent.click(screen.getByText('previews.variables.save'));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'previews/variables',
        json: {
          issueId: 'i1',
          appId: 'web-pr-12',
          scope: 'preview',
          values: { SMTP_PASSWORD: 's3cret' },
        },
      }),
    );
  });

  it('offers the Preview environment to someone who may manage it', async () => {
    show(previews({ canSetEnvironmentVariables: true }));
    expect(
      await screen.findByText('previews.variables.scopeEnvironment'),
    ).toBeTruthy();
    expect(
      document
        .querySelector('[data-variables-link="environment"]')
        ?.getAttribute('href'),
    ).toBe('/environments/preview?tab=variables');
  });

  it('only names what is missing to someone who may not edit the issue', async () => {
    show(previews({ canEdit: false }));
    expect(
      await screen.findByText(
        'previews.variables.missing(SMTP_PASSWORD, SMTP_HOST)',
      ),
    ).toBeTruthy();
    expect(screen.queryByLabelText('SMTP_PASSWORD')).toBeNull();
  });
});

describe('a blocked preview’s inbox card', () => {
  it('names what is missing and where to set it', async () => {
    const { PreviewFailedBody } =
      await import('../../client/inbox/contributions/previews-parts.js');
    const { missingOf } =
      await import('../../client/inbox/contributions/previews-model.js');
    const entry = {
      notice: {
        type: 'preview_failed',
        data: {
          appId: 'web-pr-12',
          environmentId: 'preview',
          missingVariables: 'SMTP_PASSWORD,SMTP_HOST',
        },
      },
    } as never;
    expect(missingOf(entry)).toEqual(['SMTP_PASSWORD', 'SMTP_HOST']);
    render(
      <MemoryRouter>
        <PreviewFailedBody
          entry={entry}
          model={null}
          title=''
          onDecided={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByText('previews.variables.missing(SMTP_PASSWORD, SMTP_HOST)'),
    ).toBeTruthy();
    expect(
      document
        .querySelector('[data-variables-link="environment"]')
        ?.getAttribute('href'),
    ).toBe('/environments/preview?tab=variables');
    expect(
      document
        .querySelector('[data-variables-link="app"]')
        ?.getAttribute('href'),
    ).toBe('/releases/web-pr-12?tab=variables');
  });
});
