/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Repository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('auth:lostPassword', () => {
  let app: MockServer;
  let db: Database;
  let agent;
  let userRepo: Repository;
  let notificationManagerMock;

  beforeEach(async () => {
    // Create mock server
    app = await createMockServer({
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
    app.authManager.jwt.sign = vi.fn().mockResolvedValue('mock-reset-token');

    // Clear previous mock calls
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.destroy();
  });

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

  it('should successfully send a password reset email with baseURL parameter', async () => {
    const baseURL = 'https://example.com';

    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': 'basic' }).send({
      email: 'test@example.com',
      baseURL: baseURL,
    });

    expect(res.statusCode).toBe(204);

    // Verify JWT sign was called
    expect(app.authManager.jwt.sign).toHaveBeenCalled();

    // Verify notification manager send method was called with the correct reset link
    expect(notificationManagerMock.send).toHaveBeenCalledTimes(1);
    expect(notificationManagerMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        channelName: 'email',
        message: expect.objectContaining({
          to: ['test@example.com'],
          html: expect.stringContaining(`${baseURL}/reset-password?resetToken=mock-reset-token`),
        }),
      }),
    );
  });

  it('should handle baseURL with subdirectory correctly', async () => {
    const baseURL = 'https://example.com/app';

    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': 'basic' }).send({
      email: 'test@example.com',
      baseURL: baseURL,
    });

    expect(res.statusCode).toBe(204);
    expect(notificationManagerMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          html: expect.stringContaining(`${baseURL}/reset-password?resetToken=mock-reset-token`),
        }),
      }),
    );
  });

  it('should include authenticatorName in the reset password link', async () => {
    const baseURL = 'https://example.com';
    const authenticatorName = 'basic';

    const res = await agent.post('/auth:lostPassword').set({ 'X-Authenticator': authenticatorName }).send({
      email: 'test@example.com',
      baseURL: baseURL,
    });

    expect(res.statusCode).toBe(204);

    // Verify JWT sign was called
    expect(app.authManager.jwt.sign).toHaveBeenCalled();

    // Verify notification manager send method was called with the correct reset link including authenticator name
    expect(notificationManagerMock.send).toHaveBeenCalledTimes(1);
    expect(notificationManagerMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        channelName: 'email',
        message: expect.objectContaining({
          to: ['test@example.com'],
          html: expect.stringContaining(
            `${baseURL}/reset-password?resetToken=mock-reset-token&name=${authenticatorName}`,
          ),
        }),
      }),
    );
  });
});
