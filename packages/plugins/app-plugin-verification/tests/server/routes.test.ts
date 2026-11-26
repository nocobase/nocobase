import { createApiClient } from '@nocobase/app-client';
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { userPhoneDirectoryToken } from '@nocobase/app-plugin-notification-providers/sms';
import {
  bindPhone,
  getMyVerifiedPhone,
  getVerificationRateLimit,
  issueStepUpToken,
  sendVerificationCode,
} from '@nocobase/app-plugin-verification/client';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { createAppTest, type TestApp } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { afterEach, expect, vi } from 'vitest';

import {
  changePhonePurpose,
  verificationServiceToken,
} from '../../server/index.js';
import { createStandaloneServer, fixtureSmsSecret } from '../fixtures/app.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  scope: 'test',
});
const sms = { method: 'sms', channel: 'sms', template: 'code' } as const;
const phone = '+12025550105';
const newPhone = '+12025550106';
const scene = 'externalSignIn';

afterEach(() => vi.restoreAllMocks());

function captureSms() {
  const messages: { code: string; phone: string }[] = [];
  const fetch = globalThis.fetch;
  const send = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!String(input).startsWith('https://dysmsapi.aliyuncs.com'))
      return fetch(input, init);
    const form = new URLSearchParams(String(init?.body));
    messages.push({
      code: JSON.parse(form.get('TemplateParam')!).code,
      phone: form.get('PhoneNumbers')!,
    });
    return Response.json({
      Code: 'OK',
      BizId: 'example',
      RequestId: 'example',
    });
  });
  vi.spyOn(globalThis, 'fetch').mockImplementation(send);
  return {
    messages,
    code: () => {
      const code = messages.at(-1)?.code;
      expect(code).toMatch(/^\d{6}$/);
      return code!;
    },
  };
}

function time() {
  const clock = vi.spyOn(Date, 'now');
  let now = new Date('2026-11-25T17:00:00.000Z').getTime();
  clock.mockImplementation(() => now);
  return {
    advance: (milliseconds: number) => {
      now += milliseconds;
    },
  };
}

const json = (body: object, method = 'POST', token?: string): RequestInit => ({
  method,
  headers: {
    'content-type': 'application/json',
    origin: 'http://localhost',
    ...(token ? { 'x-verification-token': token } : {}),
  },
  body: JSON.stringify(body),
});
const sendPath = '/verification/codes/send';
const phonePath = '/verification/me/phone';
const stepUpPath = '/verification/stepUpTokens';

async function person(app: TestApp, name: string) {
  const email = `${name}@example.com`;
  const password = 'verification-test-only-password';
  const created = await app.request(
    '/auth/sign-up/email',
    json({ name, email, password }),
  );
  expect(created.status).toBe(200);
  return signIn(app, { email, password });
}

test('checks the production route declarations and only permits anonymous public sends', async ({
  app,
  request,
}) => {
  const transport = captureSms();
  const service = app.container.resolve(verificationServiceToken);
  service.registerScene(scene, {
    ...sms,
    audience: 'public',
    shouldDeliver: (target) => target === phone,
  });
  const send = await request(sendPath, json({ scene, phone }));
  expect(send.status).toBe(200);
  expect(transport.messages).toHaveLength(1);
  const suppressed = await request(sendPath, json({ scene, phone: newPhone }));
  expect(suppressed.status).toBe(200);
  expect(await suppressed.json()).toMatchObject({
    data: { expiresAt: expect.any(String), resendAt: expect.any(String) },
  });
  expect(transport.messages).toHaveLength(1);
  expect(
    (await request(sendPath, json({ scene: 'bindPhone', phone }))).status,
  ).toBe(401);
  expect((await request(stepUpPath, json({}))).status).toBe(401);
  expect((await request(phonePath)).status).toBe(401);
  expect((await request(phonePath, json({}, 'PUT'))).status).toBe(401);
  expect((await request('/verification/codes/verify', json({}))).status).toBe(
    404,
  );
  expect(findUndeclaredApiRoutes(app)).toEqual([]);
  const document = await generateApiDocument(app, {
    info: { title: 'Verification', version: 'test' },
  });
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  expect(document.paths?.['/api/verification/me/phone']?.put).toMatchObject({
    security: [{ cookieAuth: [] }],
    'x-cli': { action: 'verification.phone/update' },
  });
});

test('rejects a resend across scenes and reports the next allowed time and hourly limit', async ({
  app,
  request,
}) => {
  const clock = time();
  const transport = captureSms();
  const service = app.container.resolve(verificationServiceToken);
  service.registerScene(scene, { ...sms, audience: 'public' });
  service.registerScene('invite', { ...sms, audience: 'public' });

  expect((await request(sendPath, json({ scene, phone }))).status).toBe(200);
  const resend = await request(sendPath, json({ scene: 'invite', phone }));
  expect(resend.status).toBe(429);
  expect(resend.headers.get('Retry-After')).toBe('10');
  expect(await resend.json()).toMatchObject({
    error: {
      reason: 'VERIFICATION_SEND_TOO_FREQUENT',
      metadata: { retryAt: '2026-11-25T17:00:10.000Z' },
    },
  });

  for (let index = 0; index < 2; index++) {
    clock.advance(10_000);
    expect((await request(sendPath, json({ scene, phone }))).status).toBe(200);
  }
  clock.advance(10_000);
  const hourly = await request(sendPath, json({ scene, phone }));
  expect(hourly.status).toBe(429);
  expect(await hourly.json()).toMatchObject({
    error: {
      reason: 'VERIFICATION_NUMBER_SEND_LIMIT',
      metadata: { retryAt: '2026-11-25T18:00:00.000Z' },
    },
  });
  expect(transport.messages).toHaveLength(3);
  clock.advance(3_570_000);
  expect((await request(sendPath, json({ scene, phone }))).status).toBe(200);
});

test('uses one conservative IP bucket for requests without a trusted peer', async ({
  app,
  request,
}) => {
  const clock = time();
  const transport = captureSms();
  app.container
    .resolve(verificationServiceToken)
    .registerScene(scene, { ...sms, audience: 'public' });
  for (let index = 0; index < 8; index++) {
    expect(
      (await request(sendPath, json({ scene, phone: `+1202555020${index}` })))
        .status,
    ).toBe(200);
  }
  const forged = json({ scene, phone });
  forged.headers = { ...forged.headers, 'x-forwarded-for': '203.0.113.42' };
  const blocked = await request(sendPath, forged);
  expect(blocked.status).toBe(429);
  expect(await blocked.json()).toMatchObject({
    error: {
      reason: 'VERIFICATION_IP_SEND_LIMIT',
      metadata: { retryAt: '2026-11-25T18:00:00.000Z' },
    },
  });
  expect(transport.messages).toHaveLength(8);
  clock.advance(3_600_000);
  expect((await request(sendPath, json({ scene, phone }))).status).toBe(200);
});

test('uses trusted proxy chains for anonymous limits and keeps signed-in quotas separate', async ({
  app,
  testApp,
}) => {
  time();
  captureSms();
  app.container
    .resolve(verificationServiceToken)
    .registerScene(scene, { ...sms, audience: 'public' });
  const sendFrom = (peer: string, forwarded: string, target: string) => {
    const init = json({ scene, phone: target });
    const headers = new Headers(init.headers);
    headers.set('x-forwarded-for', forwarded);
    return testApp.server.fetch(
      new Request(`http://localhost${testApp.publicBasePath}/api${sendPath}`, {
        ...init,
        headers,
      }),
      { incoming: { socket: { remoteAddress: peer } } },
    );
  };
  const trustedPeer = '192.0.2.10';
  for (let index = 0; index < 8; index++) {
    expect(
      (
        await sendFrom(
          trustedPeer,
          '203.0.113.1, 192.0.2.11',
          `+1202555030${index}`,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await sendFrom(
          '198.51.100.10',
          `203.0.113.${20 + index}`,
          `+1202555040${index}`,
        )
      ).status,
    ).toBe(200);
  }
  expect(
    (
      await sendFrom(
        trustedPeer,
        '203.0.113.99, 203.0.113.1, 192.0.2.11',
        phone,
      )
    ).status,
  ).toBe(429);
  expect((await sendFrom('198.51.100.10', '203.0.113.100', phone)).status).toBe(
    429,
  );
  expect(
    (await sendFrom(trustedPeer, '203.0.113.2, 192.0.2.11', phone)).status,
  ).toBe(200);

  for (let index = 0; index < 8; index++) {
    expect(
      (
        await testApp.request(
          sendPath,
          json({ scene, phone: `+1202555060${index}` }),
        )
      ).status,
    ).toBe(200);
  }
  expect(
    (await testApp.request(sendPath, json({ scene, phone: newPhone }))).status,
  ).toBe(429);
  const owner = await person(testApp, 'owner');
  for (let index = 0; index < 4; index++) {
    expect(
      (
        await owner.fetch(
          sendPath,
          json({ scene: 'bindPhone', phone: `+1202555050${index}` }),
        )
      ).status,
    ).toBe(200);
  }
  const blocked = await owner.fetch(
    sendPath,
    json({ scene: 'bindPhone', phone: newPhone }),
  );
  expect(blocked.status).toBe(429);
  expect(blocked.headers.get('Retry-After')).toBe('3600');
  expect(await blocked.json()).toMatchObject({
    error: {
      reason: 'VERIFICATION_USER_SEND_LIMIT',
      metadata: { retryAt: '2026-11-25T18:00:00.000Z' },
    },
  });
  const other = await person(testApp, 'other');
  expect(
    (await other.fetch(sendPath, json({ scene: 'bindPhone', phone: newPhone })))
      .status,
  ).toBe(200);
});

test('a concurrent send has one delivery and a concurrent verify has one success', async ({
  app,
}) => {
  const transport = captureSms();
  const service = app.container.resolve(verificationServiceToken);
  service.registerScene(scene, { ...sms, audience: 'public' });
  const send = () => service.send({ scene, target: phone });
  const sends = await Promise.allSettled([send(), send()]);
  expect(sends.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
  expect(sends).toContainEqual(
    expect.objectContaining({
      reason: expect.objectContaining({
        reason: 'VERIFICATION_SEND_TOO_FREQUENT',
      }),
    }),
  );
  expect(transport.messages).toHaveLength(1);
  const input = { scene, target: phone, code: transport.code() };
  const results = await Promise.allSettled([
    service.verify(input),
    service.verify(input),
  ]);
  expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
    1,
  );
  expect(results).toContainEqual(
    expect.objectContaining({
      reason: expect.objectContaining({ reason: 'VERIFICATION_CODE_INVALID' }),
    }),
  );
  await expect(service.verify(input)).rejects.toMatchObject({
    reason: 'VERIFICATION_CODE_INVALID',
  });
});

test('refuses expired codes and invalidates a code after concurrent failed attempts', async ({
  app,
}) => {
  const clock = time();
  const transport = captureSms();
  const service = app.container.resolve(verificationServiceToken);
  service.registerScene(scene, { ...sms, audience: 'public' });
  const input = { scene, target: phone };
  await service.send(input);
  const expired = transport.code();
  clock.advance(300_000);
  await expect(
    service.verify({ ...input, code: expired }),
  ).rejects.toMatchObject({ reason: 'VERIFICATION_CODE_INVALID' });

  await service.send(input);
  const valid = transport.code();
  const wrong = valid === '000000' ? '111111' : '000000';
  const attempts = await Promise.allSettled(
    Array.from({ length: 3 }, () => service.verify({ ...input, code: wrong })),
  );
  expect(attempts).toEqual(
    Array.from({ length: 3 }, () =>
      expect.objectContaining({
        reason: expect.objectContaining({
          reason: 'VERIFICATION_CODE_INVALID',
        }),
      }),
    ),
  );
  await expect(service.verify({ ...input, code: valid })).rejects.toMatchObject(
    { reason: 'VERIFICATION_CODE_INVALID' },
  );
});

test('binds to the signed-in person and changes a phone only with new and old phone proofs', async ({
  app,
  testApp,
}) => {
  const clock = time();
  const transport = captureSms();
  const owner = await person(testApp, 'owner');
  const other = await person(testApp, 'other');
  const directory = app.container.resolve(userPhoneDirectoryToken);
  const sendBinding = (target: string) =>
    owner.fetch(sendPath, json({ scene: 'bindPhone', phone: target }));
  expect((await sendBinding(phone)).status).toBe(200);
  const binding = { phone, code: transport.code() };
  expect((await other.fetch(phonePath, json(binding, 'PUT'))).status).toBe(400);
  const bound = await owner.fetch(phonePath, json(binding, 'PUT'));
  expect(bound.status).toBe(200);
  expect(await bound.json()).toEqual({ data: { phone: '••••0105' } });
  expect(await directory.find([owner.user.id, other.user.id])).toEqual(
    new Map([[owner.user.id, phone]]),
  );

  expect((await sendBinding(newPhone)).status).toBe(200);
  const replacement = { phone: newPhone, code: transport.code() };
  expect((await owner.fetch(phonePath, json(replacement, 'PUT'))).status).toBe(
    403,
  );
  clock.advance(10_000);
  expect(
    (
      await owner.fetch(
        sendPath,
        json({ scene: 'stepUp', purpose: changePhonePurpose }),
      )
    ).status,
  ).toBe(200);
  expect(transport.messages.at(-1)?.phone).toBe('12025550105');
  const issue = await owner.fetch(
    stepUpPath,
    json({ purpose: changePhonePurpose, code: transport.code() }),
  );
  expect(issue.status).toBe(200);
  expect(issue.headers.get('cache-control')).toBe('no-store');
  const { data } = await issue.json();
  const wrongCode = replacement.code === '000000' ? '111111' : '000000';
  const rejected = await owner.fetch(
    phonePath,
    json({ ...replacement, code: wrongCode }, 'PUT', data.token),
  );
  expect(rejected.status).toBe(400);
  expect(await rejected.json()).toMatchObject({
    error: { reason: 'VERIFICATION_CODE_INVALID' },
  });
  expect(
    (await owner.fetch(phonePath, json(replacement, 'PUT', data.token))).status,
  ).toBe(200);
  expect(await directory.find([owner.user.id])).toEqual(
    new Map([[owner.user.id, newPhone]]),
  );
  expect(
    (await owner.fetch(phonePath, json(replacement, 'PUT', data.token))).status,
  ).toBe(403);

  clock.advance(10_000);
  expect(
    (await other.fetch(sendPath, json({ scene: 'bindPhone', phone: newPhone })))
      .status,
  ).toBe(200);
  expect(
    (
      await other.fetch(
        phonePath,
        json({ phone: newPhone, code: transport.code() }, 'PUT'),
      )
    ).status,
  ).toBe(409);
});

test('drives the application routes through the public client API and a real session', async ({
  app,
  testApp,
}) => {
  const clock = time();
  const transport = captureSms();
  const owner = await person(testApp, 'client-owner');
  const api = createApiClient({
    baseURL: `http://localhost${testApp.publicBasePath}/api`,
    fetch: async (url, init) => owner.fetch(String(url), init),
    headers: { origin: 'http://localhost' },
  });
  const purpose = 'tenants.disable';
  app.container
    .resolve(verificationServiceToken)
    .registerStepUpPurpose(purpose);

  await expect(getMyVerifiedPhone(api)).resolves.toEqual({ phone: null });
  const input = { scene: 'bindPhone', phone };
  const timing = await sendVerificationCode(api, input);
  expect(timing).toEqual({
    expiresAt: '2026-11-25T17:05:00.000Z',
    resendAt: '2026-11-25T17:00:10.000Z',
  });
  const limited = await sendVerificationCode(api, input).catch(
    (error: unknown) => error,
  );
  expect(limited).toMatchObject({ status: 429 });
  expect(getVerificationRateLimit(limited)).toEqual({
    retryAfter: '10',
    retryAt: timing.resendAt,
  });
  await expect(
    bindPhone(api, { phone, code: transport.code() }),
  ).resolves.toEqual({
    phone: '••••0105',
  });
  await expect(getMyVerifiedPhone(api)).resolves.toEqual({ phone: '••••0105' });

  // The step-up send uses the same phone's cooldown, including across scenes.
  clock.advance(10_000);
  await sendVerificationCode(api, { scene: 'stepUp', purpose });
  const credential = await issueStepUpToken(api, {
    purpose,
    code: transport.code(),
  });
  await expect(
    app.container.resolve(verificationServiceToken).consumeStepUp({
      userId: owner.user.id,
      purpose,
      token: credential.token,
    }),
  ).resolves.toBeUndefined();
});

test('allows only one of two valid phone changes to consume the old proof', async ({
  app,
  testApp,
}) => {
  const clock = time();
  const transport = captureSms();
  const owner = await person(testApp, 'owner');
  const service = app.container.resolve(verificationServiceToken);
  const userId = owner.user.id;
  const sendBinding = async (phone: string) => {
    await service.send({ scene: 'bindPhone', target: phone, userId });
    return { phone, code: transport.code(), userId };
  };
  await service.bindPhone(await sendBinding(phone));
  clock.advance(10_000);
  await service.send({ scene: 'stepUp', purpose: changePhonePurpose, userId });
  const { token } = await service.issueStepUp({
    purpose: changePhonePurpose,
    userId,
    code: transport.code(),
  });
  const candidates = [
    await sendBinding(newPhone),
    await sendBinding('+12025550107'),
  ];
  const results = await Promise.allSettled(
    candidates.map((input) => service.bindPhone({ ...input, token })),
  );
  const winner = results.findIndex(({ status }) => status === 'fulfilled');
  expect(winner).toBeGreaterThanOrEqual(0);
  expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
    1,
  );
  expect(results).toContainEqual(
    expect.objectContaining({
      reason: expect.objectContaining({
        reason: 'VERIFICATION_STEP_UP_REQUIRED',
      }),
    }),
  );
  expect(
    await app.container.resolve(userPhoneDirectoryToken).find([userId]),
  ).toEqual(new Map([[userId, candidates[winner]!.phone]]));
});

test('consumes a user- and purpose-bound step-up proof at most once and refuses expired proofs', async ({
  app,
  testApp,
}) => {
  const clock = time();
  const transport = captureSms();
  const service = app.container.resolve(verificationServiceToken);
  const owner = await person(testApp, 'owner');
  const other = await person(testApp, 'other');
  const purpose = 'tenants.disable';
  service.registerStepUpPurpose(purpose);
  service.registerStepUpPurpose('tenants.update');
  expect(
    (await owner.fetch(sendPath, json({ scene: 'bindPhone', phone }))).status,
  ).toBe(200);
  expect(
    (
      await owner.fetch(
        phonePath,
        json({ phone, code: transport.code() }, 'PUT'),
      )
    ).status,
  ).toBe(200);
  const scope = { userId: owner.user.id, purpose };
  const issue = async () => {
    clock.advance(10_000);
    expect(
      (await owner.fetch(sendPath, json({ scene: 'stepUp', purpose }))).status,
    ).toBe(200);
    const code = transport.code();
    await expect(
      service.issueStepUp({ ...scope, purpose: 'tenants.update', code }),
    ).rejects.toMatchObject({ reason: 'VERIFICATION_CODE_INVALID' });
    return service.issueStepUp({ ...scope, code });
  };
  const denied = { reason: 'VERIFICATION_STEP_UP_REQUIRED' };
  await expect(service.consumeStepUp(scope)).rejects.toMatchObject(denied);
  const { token } = await issue();
  await expect(
    service.consumeStepUp({ ...scope, purpose: 'tenants.update', token }),
  ).rejects.toMatchObject(denied);
  await expect(
    service.consumeStepUp({ ...scope, userId: other.user.id, token }),
  ).rejects.toMatchObject(denied);
  const attempt = () => service.consumeStepUp({ ...scope, token });
  const results = await Promise.allSettled([attempt(), attempt()]);
  expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
    1,
  );
  expect(results).toContainEqual(
    expect.objectContaining({ reason: expect.objectContaining(denied) }),
  );
  await expect(attempt()).rejects.toMatchObject(denied);

  const expiring = await issue();
  clock.advance(300_000);
  await expect(
    service.consumeStepUp({ ...scope, token: expiring.token }),
  ).rejects.toMatchObject(denied);
});

test('keeps code and credentials out of verification storage, audit logs, and public configuration', async ({
  app,
  testApp,
}) => {
  const clock = time();
  const transport = captureSms();
  const owner = await person(testApp, 'owner');
  const logger = app.container.resolve(loggingToken).getLogger('verification');
  const audit = vi.spyOn(logger, 'info');
  const service = app.container.resolve(verificationServiceToken);
  service.registerStepUpPurpose('tenants.disable');

  await service.send({
    scene: 'bindPhone',
    target: phone,
    userId: owner.user.id,
  });
  const bindCode = transport.code();
  await service.bindPhone({ userId: owner.user.id, phone, code: bindCode });
  clock.advance(10_000);
  await service.send({
    scene: 'stepUp',
    purpose: 'tenants.disable',
    userId: owner.user.id,
  });
  const stepUpCode = transport.code();
  const { token } = await service.issueStepUp({
    userId: owner.user.id,
    purpose: 'tenants.disable',
    code: stepUpCode,
  });
  const db = app.container.resolve(databaseManagerToken);
  const stored = await Promise.all(
    [
      'verificationCodes',
      'verificationStepUpTokens',
      'userPhones',
      'verificationNumberLimits',
      'notificationDeliveries',
    ].map(async (name) => db.repository(name).findMany()),
  );
  expect(stored[4]).toEqual([]);
  expect(audit.mock.calls.map(([fields]) => fields)).toContainEqual(
    expect.objectContaining({ event: 'code.verified' }),
  );
  const exposed = JSON.stringify({ stored, audit: audit.mock.calls });
  for (const secret of [bindCode, stepUpCode, token, fixtureSmsSecret]) {
    expect(exposed).not.toContain(JSON.stringify(secret));
  }
  const publicConfigPaths = app.config.publicPaths?.();
  expect(publicConfigPaths).toBeDefined();
  expect(publicConfigPaths).not.toContain(
    'notification.channels.sms.aliyun.accessKeySecret',
  );
});
