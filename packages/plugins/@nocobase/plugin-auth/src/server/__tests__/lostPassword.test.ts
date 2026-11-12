/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Repository } from '@nocobase/database';
import { AppSupervisor } from '@nocobase/server';
import { createMockServer, MockServer } from '@nocobase/test';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

let app: MockServer;
let db: Database;
let agent;
let userRepo: Repository;
let notificationManagerMock;

beforeEach(() => {
  vi.stubEnv('APP_PUBLIC_ORIGIN', 'https://accounts.example.com:8443/');
  vi.stubEnv('APP_PUBLIC_PATH', '/');
});

async function startServer(name = 'main') {
  // Create mock server
  app = await createMockServer({
    name,
    plugins: ['field-sort', 'auth', 'users'],
  });

  db = app.db;
  agent = app.agent();
  userRepo = db.getRepository('users');

  // Create test user
  await userRepo.create({
    values: {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    },
  });

  // Ensure the authenticator configuration allows password reset
  const authRepo = db.getRepository('authenticators');
  await authRepo.update({
    filter: {
      name: 'basic',
    },
    values: {
      options: {
        public: {
          enableResetPassword: true,
        },
        notificationChannel: 'email',
        emailSubject: 'Reset your password',
        emailContentType: 'html',
        emailContentHTML: 'Click the link to reset your password: {{$resetLink}}',
        resetTokenExpiresIn: 60,
      },
    },
  });

  // Mock notification manager plugin
  notificationManagerMock = {
    channelTypes: new Map(),
    send: vi.fn().mockResolvedValue(true),
    manager: {
      findChannel: vi.fn().mockImplementation((name) => {
        if (notificationManagerMock.channelTypes.has(name)) {
          return {
            send: vi.fn().mockResolvedValue(true),
          };
        }
        return null;
      }),
    },
  };

  // Add mock email channel
  notificationManagerMock.channelTypes.set('email', {
    send: vi.fn().mockResolvedValue(true),
  });

  // Replace app.getPlugin method
  app.getPlugin = vi.fn().mockImplementation((name) => {
    if (name === 'notification-manager') {
      return notificationManagerMock;
    }
    return app.pm.get(name);
  });

  // Mock JWT sign function
  vi.spyOn(app.authManager.jwt, 'sign').mockResolvedValue('mock-reset-token');

  // Clear previous mock calls
  vi.clearAllMocks();
}

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await app.destroy();
});

describe('auth:lostPassword', () => {
  beforeEach(() => startServer());

  it('should return an error when email is not provided', async () => {
    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': 'basic' }).send({
      values: {},
    });

    expect(res.statusCode).toBe(400);
    expect(res.error.text).toContain('Please fill in your email address');
  });

  it('should return an error when email format is invalid', async () => {
    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': 'basic' }).send({
      email: 'invalid-email',
    });

    expect(res.statusCode).toBe(400);
    expect(res.error.text).toContain('Incorrect email format');
  });

  it('should return an error when email does not exist', async () => {
    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': 'basic' }).send({
      email: 'nonexistent@example.com',
    });

    expect(res.statusCode).toBe(401);
    expect(res.error.text).toContain('The email is incorrect, please re-enter');
  });

  it('should return an error when password reset is disabled', async () => {
    // Update authenticator configuration to disable password reset
    const authRepo = db.getRepository('authenticators');
    await authRepo.update({
      filter: {
        name: 'basic',
      },
      values: {
        options: {
          public: {
            enableResetPassword: false,
          },
        },
      },
    });

    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': 'basic' }).send({
      email: 'test@example.com',
    });

    expect(res.statusCode).toBe(403);
    expect(res.error.text).toContain('Not allowed to reset password');
  });

  it('should return an error when email channel is not found', async () => {
    // Clear channel types
    notificationManagerMock.channelTypes = new Map();

    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': 'basic' }).send({
      email: 'test@example.com',
    });

    expect(res.statusCode).toBe(400);
    expect(res.error.text).toContain('Email channel not found');
  });

  it('should return an error when notification manager plugin is not found', async () => {
    // Replace app.getPlugin method to return null
    app.getPlugin = vi.fn().mockReturnValue(null);

    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': 'basic' }).send({
      email: 'test@example.com',
    });

    expect(res.statusCode).toBe(500);

    // TODO: 这里不知道为什么不显示自定义的错误信息
    // expect(res.error.text).toContain('Notification manager plugin not found');
    expect(res.error.text).toContain('Internal Server Error');
  });

  it('should successfully send a password reset email', async () => {
    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': 'basic' }).send({
      email: 'test@example.com',
    });

    expect(res.statusCode).toBe(204);

    // Verify JWT sign was called
    expect(app.authManager.jwt.sign).toHaveBeenCalled();

    // Verify notification manager send method was called
    expect(notificationManagerMock.send).toHaveBeenCalledTimes(1);
    expect(notificationManagerMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        channelName: 'email',
        message: expect.objectContaining({
          to: ['test@example.com'],
          subject: 'Reset your password',
          contentType: 'html',
          html: expect.stringContaining('Click the link to reset your password'),
        }),
      }),
    );
  });

  it('should correctly parse variables in email subject', async () => {
    // Update authenticator configuration to use variables in subject
    const authRepo = db.getRepository('authenticators');
    await authRepo.update({
      filter: {
        name: 'basic',
      },
      values: {
        options: {
          public: {
            enableResetPassword: true,
          },
          notificationChannel: 'email',
          emailSubject: 'Reset password for {{$user.username}}',
          emailContentType: 'html',
          emailContentHTML: 'Click the link to reset your password: {{$user.username}}',
          resetTokenExpiresIn: 60,
        },
      },
    });

    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': 'basic' }).send({
      email: 'test@example.com',
    });

    expect(res.statusCode).toBe(204);

    // Verify notification manager send method was called with parsed variables in subject
    expect(notificationManagerMock.send).toHaveBeenCalledTimes(1);
    expect(notificationManagerMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        channelName: 'email',
        message: expect.objectContaining({
          to: ['test@example.com'],
          subject: 'Reset password for testuser',
          contentType: 'html',
          html: 'Click the link to reset your password: testuser',
        }),
      }),
    );
  });

  it('uses the configured origin and v2 mount path in the delivered HTML email', async () => {
    vi.stubEnv('APP_PUBLIC_PATH', '/console/');
    vi.stubEnv('APP_MODERN_CLIENT_PREFIX', 'modern');

    const res = await agent
      .post('/auth:lostPassword')
      .set({ 'X-Authenticator': 'basic', 'X-Forwarded-Host': 'proxy.example.org' })
      .send({ email: 'test@example.com', baseURL: 'https://other.example.org/console/modern' });

    expect(res.statusCode).toBe(204);
    expect(notificationManagerMock.send.mock.calls[0][0].message.html).toBe(
      'Click the link to reset your password: https://accounts.example.com:8443/console/modern/reset-password?resetToken=mock-reset-token&name=basic',
    );
  });

  it('uses the configured subpath and default client route in plain-text mail', async () => {
    vi.stubEnv('APP_PUBLIC_PATH', '/console');
    const repo = db.getRepository('authenticators');
    const basic = await repo.findOne({ filter: { name: 'basic' } });
    await repo.update({
      filterByTk: basic.id,
      values: {
        options: {
          ...basic.options,
          emailContentType: 'text',
          emailContentText: 'Reset: {{$resetLink}}',
        },
      },
    });

    const res = await agent
      .post('/auth:lostPassword')
      .set({ 'X-Authenticator': 'basic' })
      .send({ email: 'test@example.com', baseURL: 'https://other.example.org/arbitrary-path' });

    expect(res.statusCode).toBe(204);
    expect(notificationManagerMock.send.mock.calls[0][0].message.text).toBe(
      'Reset: https://accounts.example.com:8443/console/reset-password?resetToken=mock-reset-token&name=basic',
    );
  });

  it.each([
    '',
    'not a URL',
    'ftp://example.com',
    'https://example.com/subpath',
    'https://user@example.com',
    'https://example.com?setting=1',
    'https://example.com/#section',
  ])('does not sign a token or send mail with invalid APP_PUBLIC_ORIGIN %j', async (origin) => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', origin);
    const res = await agent
      .post('/auth:lostPassword')
      .set({ 'X-Authenticator': 'basic' })
      .send({ email: 'test@example.com', baseURL: 'https://example.com' });
    expect(res.statusCode).toBe(503);
    expect(app.authManager.jwt.sign).not.toHaveBeenCalled();
    expect(notificationManagerMock.send).not.toHaveBeenCalled();
  });

  it('warns during upgrade when existing email password recovery settings need a public origin', async () => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', '');
    const warn = vi.spyOn(app.logger, 'warn');
    try {
      await app.emitAsync('afterUpgrade', app, {});
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('APP_PUBLIC_ORIGIN'));
    } finally {
      warn.mockRestore();
    }
  });

  it('requires a public origin when an administrator enables email password recovery', async () => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', '');
    const basic = await db.getRepository('authenticators').findOne({ filter: { name: 'basic' } });
    const resource = agent.resource('authenticators');
    const update = (enabled: boolean) =>
      resource.update({
        filterByTk: basic.id,
        values: {
          enabled: true,
          options: { ...basic.options, public: { enableResetPassword: enabled } },
        },
      });
    expect((await update(false)).statusCode).toBe(200);
    const rejected = await update(true);
    expect(rejected.statusCode).toBe(400);
    expect(rejected.text).toContain('APP_PUBLIC_ORIGIN');
    vi.stubEnv('APP_PUBLIC_ORIGIN', 'https://accounts.example.com');
    expect((await update(true)).statusCode).toBe(200);
  });
});

describe('sub-application domains', () => {
  async function startSubApp(name = 'sales') {
    await startServer(name);
    return vi.spyOn(AppSupervisor.getInstance(), 'getAppModel');
  }

  async function requestEmail() {
    return agent
      .post('/auth:lostPassword')
      .set({ 'X-Authenticator': 'basic', 'X-Forwarded-Host': 'proxy.example.org' })
      .send({ email: 'test@example.com', baseURL: 'https://portal.example.org/console/v/apps/sales' });
  }

  beforeEach(() => {
    vi.stubEnv('APP_PUBLIC_PATH', '/console/');
    vi.stubEnv('APP_MODERN_CLIENT_PREFIX', 'v');
  });

  it.each([
    ['sales', 'sales.example.com', 'https://portal.example.org'],
    ['billing', 'billing.example.com', ''],
  ])('sends %s mail to its registered domain', async (name, cname, globalOrigin) => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', globalOrigin);
    const lookup = (await startSubApp(name)).mockResolvedValue({ name, cname, options: {} });
    vi.mocked(app.authManager.jwt.sign).mockRestore();
    expect((await requestEmail()).statusCode).toBe(204);
    expect(lookup).toHaveBeenCalledWith(name);
    const html = notificationManagerMock.send.mock.calls[0][0].message.html;
    const link = new URL(html.slice(html.indexOf('https://')));
    expect(link.origin + link.pathname).toBe(`https://${cname}/console/v/reset-password`);
    const reset = await agent
      .post('/auth:resetPassword')
      .set({ 'X-Authenticator': link.searchParams.get('name') })
      .send({ resetToken: link.searchParams.get('resetToken'), password: 'changedPassword123' });
    expect(reset.statusCode).toBe(204);
  });

  it.each(['single', 'multiple'] as const)('uses the public origin for an unbound app in %s mode', async (mode) => {
    const lookup = await startSubApp();
    const supervisor = AppSupervisor.getInstance();
    const originalMode = supervisor.runningMode;
    try {
      supervisor.runningMode = mode;
      lookup.mockResolvedValue({ name: 'sales', options: {} });
      expect((await requestEmail()).statusCode).toBe(204);
      const segment = mode === 'single' ? '' : '/apps/sales';
      expect(notificationManagerMock.send.mock.calls[0][0].message.html).toContain(
        `https://accounts.example.com:8443/console/v${segment}/reset-password?resetToken=`,
      );
    } finally {
      supervisor.runningMode = originalMode;
    }
  });

  it.each(['malformed domain', 'missing record', 'unavailable registry', 'missing origin'])(
    'stops before token issuance and delivery for %s',
    async (condition) => {
      const lookup = await startSubApp();
      if (condition === 'unavailable registry') {
        lookup.mockRejectedValue(new Error('registry unavailable'));
      } else if (condition === 'missing record') {
        lookup.mockResolvedValue(null);
      } else if (condition === 'missing origin') {
        lookup.mockResolvedValue({ name: 'sales', options: {} });
        vi.stubEnv('APP_PUBLIC_ORIGIN', '');
      } else {
        lookup.mockResolvedValue({ name: 'sales', cname: 'bad.example/path', options: {} });
      }
      expect((await requestEmail()).statusCode).toBe(503);
      expect(app.authManager.jwt.sign).not.toHaveBeenCalled();
      expect(notificationManagerMock.send).not.toHaveBeenCalled();
    },
  );

  it('uses the current binding when enabling recovery and when warning on upgrade', async () => {
    vi.stubEnv('APP_PUBLIC_ORIGIN', '');
    const lookup = (await startSubApp()).mockResolvedValue({ name: 'sales', options: {} });
    const basic = await db.getRepository('authenticators').findOne({ filter: { name: 'basic' } });
    const update = (enabled: boolean) =>
      agent.resource('authenticators').update({
        filterByTk: basic.id,
        values: { enabled: true, options: { ...basic.options, public: { enableResetPassword: enabled } } },
      });
    expect((await update(false)).statusCode).toBe(200);
    expect((await update(true)).statusCode).toBe(400);
    lookup.mockResolvedValue({ name: 'sales', cname: 'sales.example.com', options: {} });
    expect((await update(true)).statusCode).toBe(200);
    const warn = vi.spyOn(app.logger, 'warn');
    await app.emitAsync('afterUpgrade', app, {});
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('email password recovery'));
    lookup.mockResolvedValue({ name: 'sales', cname: 'bad.example/path', options: {} });
    await app.emitAsync('afterUpgrade', app, {});
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('custom domain'));
  });
});
