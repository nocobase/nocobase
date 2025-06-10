/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer, sleep } from '@nocobase/test';
import PluginVerficationServer from '../../Plugin';
import { VerificationManager } from '../../verification-manager';
import { SMSProvider } from '../../otp-verification/sms/providers';

class MockSMSProvider extends SMSProvider {
  async send() {
    return true;
  }
}

describe('verify', async () => {
  let app: MockServer;
  let manager: VerificationManager;
  let agent: any;

  beforeEach(async () => {
    if (process.env.CACHE_REDIS_URL) {
      app = await createMockServer({
        cacheManager: {
          defaultStore: 'redis',
          stores: {
            redis: {
              url: process.env.CACHE_REDIS_URL,
            },
          },
        },
        plugins: ['verification'],
      });
    } else {
      app = await createMockServer({
        plugins: ['verification'],
      });
    }
    agent = app.agent();
    app.resourceManager.define({
      name: 'test',
      actions: {
        verify: async (ctx, next) => {
          ctx.body = {};
          await next();
        },
      },
    });
    const plugin = app.pm.get('verification') as PluginVerficationServer;
    manager = plugin.verificationManager;
    plugin.smsOTPProviderManager.registerProvider('mock', {
      title: 'Mock',
      provider: MockSMSProvider,
    });
  });

  afterEach(async () => {
    await app.cache.reset();
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('should create sms otp record', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verifiers').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'mock',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    const record = await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verifierName: 'test',
      },
    });
    expect(record).toBeTruthy();
  });

  it('rate limit', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verifiers').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'mock',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    const res1 = await agent.resource('smsOTP').create({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res1.status).toBe(429);
  });

  it('verify failed', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verifiers').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'mock',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verifierName: 'test',
      },
    });
    const res1 = await agent.resource('test').verify({
      values: {
        verifier: 'test',
        uuid: '13888888888',
      },
    });
    expect(res1.status).toBe(400);
    expect(res1.error.text).toBe('Verification code is invalid');
    const res2 = await agent.resource('test').verify({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        code: '123456',
      },
    });
    expect(res2.status).toBe(400);
    expect(res2.error.text).toBe('Verification code is invalid');
  });

  it('verify', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verifiers').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'mock',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    const record = await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verifierName: 'test',
      },
    });
    expect(record.status).toBe(0);
    const res1 = await agent.resource('test').verify({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        code: record.code,
      },
    });
    expect(res1.status).toBe(200);
    const record2 = await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verifierName: 'test',
      },
    });
    expect(record2.status).toBe(1);
  });

  it('verify expire', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verifiers').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'mock',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    const record = await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verifierName: 'test',
      },
    });
    await record.update({
      expiresAt: new Date(),
    });
    const res1 = await agent.resource('test').verify({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        code: record.code,
      },
    });
    expect(res1.status).toBe(400);
    expect(res1.error.text).toBe('Verification code is invalid');
  });

  it('verify failed rate limit', async () => {
    manager.registerAction('test:verify', {
      getBoundInfoFromCtx: async (ctx) => ctx.action.params.values || {},
    });
    await app.db.getRepository('verifiers').create({
      values: {
        name: 'test',
        title: 'Test',
        verificationType: 'sms-otp',
        options: {
          provider: 'mock',
          settings: {},
        },
      },
    });
    const res = await agent.resource('smsOTP').create({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        action: 'test:verify',
      },
    });
    expect(res.status).toBe(200);
    const record = await app.db.getRepository('otpRecords').findOne({
      filter: {
        action: 'test:verify',
        receiver: '13888888888',
        verifierName: 'test',
      },
    });
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(
        await agent.resource('test').verify({
          values: {
            verifier: 'test',
            uuid: '13888888888',
            code: '123456',
          },
        }),
      );
    }
    const resps = await Promise.all(promises);
    expect(resps.filter((r) => r.status === 429).length).toBe(1);
    expect(resps.filter((r) => r.status === 400).length).toBe(5);
    const res1 = await agent.resource('test').verify({
      values: {
        verifier: 'test',
        uuid: '13888888888',
        code: record.code,
      },
    });
    expect(res1.status).toBe(429);
  });
});
