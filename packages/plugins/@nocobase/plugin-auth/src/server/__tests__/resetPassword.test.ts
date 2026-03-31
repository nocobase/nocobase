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

describe('auth:resetPassword & auth:checkResetToken', () => {
  let app: MockServer;
  let db: Database;
  let agent;
  let userRepo: Repository;
  let notificationManagerMock;
  let validToken: string;
  let expiredToken: string;
  let testUser;

  beforeEach(async () => {
    // Create mock server
    app = await createMockServer({
      plugins: ['field-sort', 'auth', 'users'],
    });

    db = app.db;
    agent = app.agent();
    userRepo = db.getRepository('users');

    // Create test user
    testUser = await userRepo.create({
      values: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldpassword',
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
            emailChannel: 'email',
            emailSubject: 'Reset your password',
            emailContentType: 'html',
            emailContent: 'Click the link to reset your password: $resetLink',
            resetTokenExpiresIn: '1h',
          },
        },
      },
    });

    // Mock notification manager plugin
    notificationManagerMock = {
      channelTypes: new Map(),
      send: vi.fn().mockResolvedValue(true),
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

    // Create a valid reset token
    validToken = await app.authManager.jwt.sign(
      {
        resetPasswordUserId: testUser.id,
      },
      {
        expiresIn: '1h',
      },
    );

    // Create an expired token for testing
    expiredToken = 'expired.token.value';
    app.authManager.jwt.decode = vi.fn().mockImplementation((token) => {
      if (token === expiredToken) {
        throw new Error('Token expired');
      }
      return { resetPasswordUserId: testUser.id };
    });

    app.authManager.jwt.block = vi.fn().mockResolvedValue(true);

    // Mock blacklist checking
    app.authManager.jwt.blacklist = {
      has: vi.fn().mockImplementation(async (token) => {
        return token === expiredToken;
      }),
      add: vi.fn().mockResolvedValue(true),
    };

    // Clear previous mock calls
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.destroy();
  });

  // Tests for auth:checkResetToken
  describe('auth:checkResetToken', () => {
    it('should return true when token is valid', async () => {
      const res = await agent.post('/auth:checkResetToken').set({ 'X-Authenticator': 'basic' }).send({
        resetToken: validToken,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBe(true);
    });

    it('should return an error when token is expired', async () => {
      const res = await agent.post('/auth:checkResetToken').set({ 'X-Authenticator': 'basic' }).send({
        resetToken: expiredToken,
      });

      expect(res.statusCode).toBe(401);
      expect(res.error.text).toContain('Token expired');
    });

    it('should return an error when token is invalid', async () => {
      app.authManager.jwt.decode = vi.fn().mockRejectedValue(new Error('Invalid token'));

      const res = await agent.post('/auth:checkResetToken').set({ 'X-Authenticator': 'basic' }).send({
        resetToken: 'invalid.token',
      });

      expect(res.statusCode).toBe(401);
      expect(res.error.text).toContain('Token expired');
    });
  });

  // Tests for auth:resetPassword
  describe('auth:resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      const res = await agent.post('/auth:resetPassword').set({ 'X-Authenticator': 'basic' }).send({
        resetToken: validToken,
        password: 'newpassword123',
      });

      expect(res.statusCode).toBe(204);

      // Verify jwt.block was called to invalidate the token
      expect(app.authManager.jwt.block).toHaveBeenCalledWith(validToken);

      // Verify user password was changed by trying to sign in with the new password
      const signInRes = await agent.post('/auth:signIn').set({ 'X-Authenticator': 'basic' }).send({
        account: 'test@example.com',
        password: 'newpassword123',
      });

      expect(signInRes.statusCode).toBe(200);
    });

    it('should return an error when resetToken is not provided', async () => {
      const res = await agent.post('/auth:resetPassword').set({ 'X-Authenticator': 'basic' }).send({
        password: 'newpassword123',
      });

      expect(res.statusCode).toBe(401);
      expect(res.error.text).toContain('Token expired');
    });

    it('should return an error when resetToken is expired', async () => {
      const res = await agent.post('/auth:resetPassword').set({ 'X-Authenticator': 'basic' }).send({
        resetToken: expiredToken,
        password: 'newpassword123',
      });

      expect(res.statusCode).toBe(401);
      expect(res.error.text).toContain('Token expired');
    });

    it('should return an error when user does not exist', async () => {
      // Mock jwt.decode to return a non-existent user ID
      const nonExistentUserToken = 'non.existent.user';
      app.authManager.jwt.decode = vi.fn().mockImplementation((token) => {
        if (token === nonExistentUserToken) {
          return { resetPasswordUserId: 999999 }; // Non-existent user ID
        }
        return { resetPasswordUserId: testUser.id };
      });

      app.authManager.jwt.blacklist.has = vi.fn().mockResolvedValue(false);

      const res = await agent.post('/auth:resetPassword').set({ 'X-Authenticator': 'basic' }).send({
        resetToken: nonExistentUserToken,
        password: 'newpassword123',
      });

      expect(res.statusCode).toBe(404);
      expect(res.error.text).toContain('User not found');
    });
  });
});
