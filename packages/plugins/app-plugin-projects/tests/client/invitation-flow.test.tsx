// @vitest-environment-options { "url": "http://localhost" }
import authentication, {
  GuestAuthentication,
  usePasswordLogin,
} from '@nocobase/app-plugin-authentication/client';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import users from '@nocobase/app-plugin-users/client';
import usersRoutes from '@nocobase/app-plugin-users/client/routes';
import { createTestApp } from '@nocobase/app-testing/server';
import { renderWithApp } from '@nocobase/app-testing/client';
import { cleanup, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';

import { createInvitationServer } from '../helpers/invitation-app.js';
import type { InvitationResult } from '../../shared/invitations.js';
import type { ProjectDetail } from '../../shared/projects.js';

const EMAIL = 'browser-invite@example.test';
const PASSWORD = 'original-invitation-password';

/** The host supplies its login page; the action, session provider and return-path guard are production code. */
function LoginPage(): ReactElement {
  const login = usePasswordLogin();
  return (
    <GuestAuthentication>
      <button
        onClick={() => login.submit({ identifier: EMAIL, password: PASSWORD })}
      >
        Sign in as invitee
      </button>
    </GuestAuthentication>
  );
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

it('returns from real password sign-in to the pending invitation and grants its project membership', async () => {
  const server = await createTestApp({ createServer: createInvitationServer });
  try {
    const admin = await signIn(server, {
      email: DEFAULT_ADMIN_CREDENTIALS.email,
      password: DEFAULT_ADMIN_CREDENTIALS.password,
    });
    const post = (body: unknown): RequestInit => ({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
      },
      body: JSON.stringify(body),
    });
    const projectResponse = await admin.fetch(
      '/projects',
      post({ name: 'Browser project', visibility: 'members' }),
    );
    expect(projectResponse.status).toBe(201);
    const { data: project } = (await projectResponse.json()) as {
      data: ProjectDetail;
    };
    const tokens: string[] = [];
    for (const projectIds of [[], [project.id]]) {
      const response = await admin.fetch(
        '/projects/invitations',
        post({ emails: [EMAIL], projectIds }),
      );
      expect(response.status).toBe(201);
      const { data } = (await response.json()) as {
        data: { results: InvitationResult[] };
      };
      const token = data.results[0]?.inviteUrl?.split('/').at(-1);
      if (!token) throw new Error('Missing invitation token.');
      tokens.push(token);
    }
    // In-process browser transport: preserve the real Set-Cookie headers between requests, including Better Auth's fetches.
    const cookies = new Map<string, string>();
    const browserFetch: typeof fetch = async (input, init) => {
      const request = new Request(input, init);
      request.headers.set('origin', 'http://localhost');
      if (cookies.size)
        request.headers.set(
          'cookie',
          [...cookies].map(([key, value]) => `${key}=${value}`).join('; '),
        );
      const response = await server.fetch(request);
      for (const header of response.headers.getSetCookie()) {
        const pair = header.split(';')[0];
        const separator = pair.indexOf('=');
        cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
      }
      return response;
    };
    vi.stubGlobal('fetch', browserFetch);
    const route = usersRoutes.routes.find((item) => item.name === 'invite');
    if (!route?.componentLoader)
      throw new Error('Missing public invitation page.');
    const { default: InvitationPage } = await route.componentLoader();
    const user = userEvent.setup();
    await renderWithApp(
      <Routes>
        <Route path='/invite/:token' element={<InvitationPage />} />
        <Route path='/' element={<p>Registered home</p>} />
      </Routes>,
      {
        plugins: [authentication(), users()],
        namespaces: { '@nocobase/i18n': { status: { loading: 'Loading' } } },
        server: { publicBasePath: server.publicBasePath, fetch: browserFetch },
        route: `/invite/${tokens[0]}`,
      },
    );
    await user.type(await screen.findByLabelText('Name'), 'Invitee');
    await user.type(screen.getByLabelText('Password'), PASSWORD);
    await user.click(
      screen.getByRole('button', { name: 'Create account and join' }),
    );
    await screen.findByText('Registered home');
    cleanup();
    cookies.clear();
    sessionStorage.clear();
    await renderWithApp(
      <Routes>
        <Route path='/invite/:token' element={<InvitationPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/' element={<p>Joined home</p>} />
      </Routes>,
      {
        plugins: [authentication(), users()],
        namespaces: {
          '@nocobase/i18n': { status: { loading: 'Loading' } },
        },
        server: { publicBasePath: server.publicBasePath, fetch: browserFetch },
        route: `/invite/${tokens[1]}`,
      },
    );
    await user.click(
      await screen.findByRole('button', { name: 'Go to sign in' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Sign in as invitee' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Accept invitation' }),
    );
    await screen.findByText('Joined home');
    const invitee = await signIn(server, { email: EMAIL, password: PASSWORD });
    const response = await invitee.fetch(`/projects/${project.id}`);
    expect(response.status).toBe(200);
    const { data: joined } = (await response.json()) as { data: ProjectDetail };
    expect(joined.members.map((member) => member.id)).toContain(
      invitee.user.id,
    );
  } finally {
    cleanup();
    await server.close();
  }
});
