import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { realtimeClientToken } from '@nocobase/app-client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import {
  AuthenticationProvider,
  authenticationClientToken,
  type AuthClient,
} from '@nocobase/app-plugin-authentication/client';
import {
  createRealtimeService,
  type RealtimeConnection,
} from '@nocobase/app-server/realtime';
import plugin from '../../client/index.js';
import Page from '../../client/pages/realtime.js';
import { RealtimeExampleService } from '../../server/demo-service.js';

const dispose: (() => Promise<void>)[] = [];
afterEach(async () => {
  cleanup();
  for (const close of dispose.splice(0)) await close();
  vi.unstubAllGlobals();
});

async function setup(
  options: {
    locale?: string;
    failInitialRead?: boolean;
    failRevocation?: boolean;
    failPublication?: boolean;
  } = {},
) {
  const server = createRealtimeService();
  const clock = server.defineTopic<string>('clock:now', {
    audience: 'public',
  });
  const demo = new RealtimeExampleService(server);
  await server.setup();
  // Bridge only the transport: the server, browser client, hooks and acknowledgement protocol are real.
  class Socket {
    static OPEN = 1;
    static CONNECTING = 0;
    readyState = 0;
    onopen?: () => void;
    onmessage?: (event: { data: string }) => void;
    onclose?: () => void;
    connection?: RealtimeConnection;
    constructor() {
      queueMicrotask(() => {
        if (this.readyState !== 0) return;
        this.readyState = 1;
        this.connection = server.connect(
          {
            readyState: 1,
            send: (data) =>
              queueMicrotask(() => {
                if (this.readyState === 1) this.onmessage?.({ data });
              }),
            close: () => this.close(),
          },
          { principal: { userId: 'alice' } },
        );
        this.onopen?.();
      });
    }
    send(data: string) {
      if (this.connection)
        void server.handleClientMessage(this.connection, data);
    }
    close() {
      if (this.readyState === 3) return;
      this.readyState = 3;
      if (this.connection) server.disconnect(this.connection);
      this.onclose?.();
    }
  }
  vi.stubGlobal('WebSocket', Socket);
  dispose.push(async () => {
    demo.close();
    clock.close();
    await server.close();
  });
  const requests: string[] = [];
  let failInitialRead = options.failInitialRead;
  let failRevocation = options.failRevocation;
  let failPublication = options.failPublication;
  let delayRoom: (() => Promise<void>) | undefined;
  const view = await renderWithApp(
    <AuthenticationProvider>
      <Page />
    </AuthenticationProvider>,
    {
      plugins: [plugin()],
      namespace: '@nocobase/app-plugin-realtime-example',
      locale: options.locale,
      services(app) {
        app.container.instance(authenticationClientToken, {
          getSession: async () => ({
            data: { user: { id: 'alice' }, session: { id: 'test-session' } },
          }),
        } as unknown as AuthClient);
      },
      fetch: answerApi(async ({ method, path, json }) => {
        requests.push(`${method} ${path}`);
        if (path === 'realtimeExample/state') {
          if (failInitialRead) {
            failInitialRead = false;
            return Response.json(
              { error: { message: 'Unavailable' } },
              { status: 500 },
            );
          }
          return { data: demo.state('alice') };
        }
        if (path === 'realtimeExample/personal')
          return { data: demo.personal('alice') };
        if (path === 'realtimeExample/personal/events') {
          if (failPublication) {
            failPublication = false;
            return Response.json(
              { error: { message: 'Unavailable' } },
              { status: 500 },
            );
          }
          return { data: await demo.sendPersonal('alice') };
        }
        if (path === 'realtimeExample/counter')
          return { data: demo.counter('alice') };
        if (path === 'realtimeExample/counter/events')
          return {
            data: await demo.burst('alice', (json as { count: number }).count),
          };
        if (path === 'realtimeExample/connection/disconnect')
          return { data: { disconnected: await demo.disconnect('alice') } };
        const roomId = demo.state('alice').room.id;
        if (path === `realtimeExample/rooms/${roomId}/access`) {
          if (!(json as { allowed: boolean }).allowed && failRevocation) {
            failRevocation = false;
            return Response.json(
              { error: { message: 'Unavailable' } },
              { status: 500 },
            );
          }
          return {
            data: await demo.setAccess(
              'alice',
              roomId,
              (json as { allowed: boolean }).allowed,
            ),
          };
        }
        if (path === `realtimeExample/rooms/${roomId}/events`)
          return { data: await demo.sendRoom('alice', roomId) };
        if (path === `realtimeExample/rooms/${roomId}`) {
          const snapshot = demo.readRoom('alice', roomId);
          await delayRoom?.();
          return { data: snapshot };
        }
        throw new Error(`Unhandled request: ${method} ${path}`);
      }),
    },
  );
  return {
    ...view,
    server,
    clock,
    realtime: view.app.services.resolve(realtimeClientToken),
    demo,
    requests,
    delayRoom: (delay: () => Promise<void>) => {
      delayRoom = delay;
    },
  };
}

function panel(name: RegExp) {
  return within(screen.getByRole('region', { name }));
}
function metric(region: ReturnType<typeof panel>, label: string) {
  return region.getByText(label).nextElementSibling;
}

it('demonstrates real delivery, per-topic errors, coalescing, pause/catch-up and automatic recovery', async () => {
  const app = await setup();
  const user = userEvent.setup();
  await screen.findByRole('region', { name: /1\. Public/ });
  const clock = panel(/1\. Public/);
  const personal = panel(/2\. Personal/);
  const counter = panel(/4\. Coalesced/);
  const unknown = panel(/5\. Subscription/);
  await waitFor(() =>
    expect(metric(counter, 'Observed snapshot')).toHaveTextContent('0'),
  );
  await act(async () => {
    await app.clock.publish('2026-10-18T12:00:00.000Z');
  });
  expect(metric(clock, 'Events received')).toHaveTextContent('1');
  await user.click(clock.getByRole('button', { name: 'Pause subscription' }));
  await act(async () => {
    await app.clock.publish('2026-10-18T12:00:01.000Z');
  });
  expect(metric(clock, 'Events received')).toHaveTextContent('1');
  await user.click(clock.getByRole('button', { name: 'Resume subscription' }));
  await user.click(
    unknown.getByRole('button', { name: 'Try an unknown topic' }),
  );
  expect(await unknown.findByText('TOPIC_NOT_FOUND')).toBeVisible();
  await user.click(
    personal.getByRole('button', { name: 'Send to my account' }),
  );
  await waitFor(() =>
    expect(metric(personal, 'Observed snapshot')).toHaveTextContent('1'),
  );
  expect(metric(personal, 'Events received')).toHaveTextContent('1');
  const reads = Number(
    metric(counter, 'Completed snapshot reads')?.textContent,
  );
  await user.click(counter.getByRole('button', { name: 'Publish 5 changes' }));
  await waitFor(() =>
    expect(metric(counter, 'Observed snapshot')).toHaveTextContent('5'),
  );
  expect(metric(counter, 'Events received')).toHaveTextContent('5');
  expect(
    Number(metric(counter, 'Completed snapshot reads')?.textContent) - reads,
  ).toBe(1);
  await user.click(counter.getByRole('button', { name: 'Pause live refresh' }));
  await user.click(counter.getByRole('button', { name: 'Publish 5 changes' }));
  await waitFor(() =>
    expect(metric(counter, 'Events received')).toHaveTextContent('10'),
  );
  expect(metric(counter, 'Observed snapshot')).toHaveTextContent('5');
  const pausedReady = Number(metric(counter, 'Acknowledgements')?.textContent);
  await user.click(
    screen.getByRole('button', { name: 'Reconnect', exact: true }),
  );
  await waitFor(() =>
    expect(
      Number(metric(counter, 'Acknowledgements')?.textContent),
    ).toBeGreaterThan(pausedReady),
  );
  expect(metric(counter, 'Observed snapshot')).toHaveTextContent('5');
  await user.click(
    counter.getByRole('button', { name: 'Resume live refresh' }),
  );
  await waitFor(() =>
    expect(metric(counter, 'Observed snapshot')).toHaveTextContent('10'),
  );
  const ready = Number(metric(personal, 'Acknowledgements')?.textContent);
  await user.click(screen.getByRole('button', { name: 'Simulate disconnect' }));
  await waitFor(() =>
    expect(
      Number(metric(personal, 'Acknowledgements')?.textContent),
    ).toBeGreaterThan(ready),
  );
  expect(
    panel(/6\. Connection/).getByText('Reconnecting', { exact: false }),
  ).toBeVisible();
  const readyAgain = Number(metric(personal, 'Acknowledgements')?.textContent);
  await user.click(
    screen.getByRole('button', { name: 'Reconnect', exact: true }),
  );
  await waitFor(() =>
    expect(
      Number(metric(personal, 'Acknowledgements')?.textContent),
    ).toBeGreaterThan(readyAgain),
  );
  app.unmount();
  expect(app.realtime.active).toBe(false);
});

it('keeps a failed revocation actionable and prevents a delayed read from restoring revoked data', async () => {
  const app = await setup({ failRevocation: true });
  const user = userEvent.setup();
  await screen.findByRole('region', { name: /3\. Dynamic/ });
  const room = panel(/3\. Dynamic/);
  expect(await room.findByText('FORBIDDEN')).toBeVisible();
  await user.click(room.getByRole('button', { name: 'Grant access' }));
  await user.click(
    await room.findByRole('button', { name: 'Retry subscription' }),
  );
  await waitFor(() =>
    expect(metric(room, 'Observed snapshot')).toHaveTextContent('0'),
  );
  await user.click(room.getByRole('button', { name: 'Publish room change' }));
  await waitFor(() =>
    expect(metric(room, 'Observed snapshot')).toHaveTextContent('1'),
  );
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  app.delayRoom(() => held);
  await user.click(room.getByRole('button', { name: 'Publish room change' }));
  await room.findByText('Refreshing snapshot…');
  await user.click(room.getByRole('button', { name: 'Revoke access' }));
  const dialog = within(screen.getByRole('alertdialog'));
  await user.click(dialog.getByRole('button', { name: 'Revoke access' }));
  expect(
    await dialog.findByText('The request failed. Try again.'),
  ).toBeVisible();
  expect(dialog.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  await user.click(dialog.getByRole('button', { name: 'Revoke access' }));
  await waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
  );
  expect(await room.findByText('FORBIDDEN')).toBeVisible();
  await act(async () => {
    release();
    await held;
  });
  expect(metric(room, 'Observed snapshot')).toHaveTextContent(
    'hidden while access is denied',
  );
  expect(room.getByRole('button', { name: 'Grant access' })).toBeEnabled();
  expect(
    room.queryByRole('button', { name: 'Publish room change' }),
  ).not.toBeInTheDocument();
});

it('offers a retry after an initial request failure and loads the Chinese interface', async () => {
  await setup({ locale: 'zh-CN', failInitialRead: true });
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: '重试', exact: true }),
  );
  await waitFor(() => expect(screen.getAllByRole('region')).toHaveLength(6));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Realtime',
  );
});

it('retries a failed publication through its action and clears the action error on success', async () => {
  const app = await setup({ failPublication: true });
  const user = userEvent.setup();
  await screen.findByRole('region', { name: /2\. Personal/ });
  const personal = panel(/2\. Personal/);
  await waitFor(() =>
    expect(metric(personal, 'Observed snapshot')).toHaveTextContent('0'),
  );
  await user.click(
    personal.getByRole('button', { name: 'Send to my account' }),
  );
  expect(
    await personal.findByText('The request failed. Try again.'),
  ).toBeVisible();
  expect(
    personal.queryByRole('button', { name: 'Retry', exact: true }),
  ).not.toBeInTheDocument();
  await user.click(
    personal.getByRole('button', { name: 'Send to my account' }),
  );
  await waitFor(() =>
    expect(metric(personal, 'Observed snapshot')).toHaveTextContent('1'),
  );
  expect(
    personal.queryByText('The request failed. Try again.'),
  ).not.toBeInTheDocument();
  expect(
    app.requests.filter(
      (request) => request === 'POST realtimeExample/personal/events',
    ),
  ).toHaveLength(2);
});
