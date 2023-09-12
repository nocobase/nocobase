import Database from '@nocobase/database';
import { MockServer } from '@nocobase/test';

import Plugin, { Provider } from '..';

import { getApp, sleep } from '.';

describe('verification > Plugin', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let plugin;
  let AuthorModel;
  let AuthorRepo;
  let VerificationModel;
  let provider;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;
    plugin = <Plugin>app.getPlugin('verification');
    VerificationModel = db.getCollection('verifications').model;
    AuthorModel = db.getCollection('authors').model;
    AuthorRepo = db.getCollection('authors').repository;

    plugin.providers.register('fake', Provider);

    const VerificationProviderModel = db.getCollection('verifications_providers').model;
    provider = await VerificationProviderModel.create({
      id: 'fake1',
      type: 'fake',
      default: true,
    });
  });

  afterEach(() => app.destroy());

  describe('auto intercept', () => {
    beforeEach(async () => {
      plugin.interceptors.register('authors:create', {
        getReceiver(ctx) {
          return ctx.action.params.values.phone;
        },
        expiresIn: 2,
      });
    });

    it('submit in time', async () => {
      const res1 = await agent.resource('authors').create({
        values: { phone: '1' },
      });
      expect(res1.status).toBe(400);

      const res2 = await agent.resource('verifications').create({
        values: {
          type: 'authors:create',
          phone: '1',
        },
      });
      expect(res2.status).toBe(200);
      expect(res2.body.data.id).toBeDefined();
      expect(res2.body.data.content).toBeUndefined();
      const expiresAt = Date.parse(res2.body.data.expiresAt);
      expect(expiresAt - Date.now()).toBeLessThan(2000);

      const res3 = await agent.resource('verifications').create({
        values: {
          type: 'authors:create',
          phone: '1',
        },
      });
      expect(res3.status).toBe(429);

      const verification = await VerificationModel.findByPk(res2.body.data.id);
      const res4 = await agent.resource('authors').create({
        values: { phone: '1', code: verification.get('content') },
      });
      expect(res4.status).toBe(200);
    });

    it('expired', async () => {
      const res1 = await agent.resource('verifications').create({
        values: {
          type: 'authors:create',
          phone: '1',
        },
      });

      await sleep(2000);

      const verification = await VerificationModel.findByPk(res1.body.data.id);
      const res2 = await agent.resource('authors').create({
        values: { phone: '1', code: verification.get('content') },
      });
      expect(res2.status).toBe(400);
    });
  });

  describe('manually intercept', () => {
    beforeEach(async () => {
      plugin.interceptors.register('authors:create', {
        manual: true,
        getReceiver(ctx) {
          return ctx.action.params.values.phone;
        },
        expiresIn: 2,
      });
    });

    it('will not intercept', async () => {
      const res1 = await agent.resource('authors').create({
        values: { phone: '1' },
      });
      expect(res1.status).toBe(200);
    });

    it('will intercept', async () => {
      app.resourcer.registerActionHandler('authors:create', plugin.intercept);

      const res1 = await agent.resource('authors').create({
        values: { phone: '1' },
      });
      expect(res1.status).toBe(400);
    });
  });

  describe('validate', () => {
    beforeEach(async () => {
      plugin.interceptors.register('authors:create', {
        getReceiver(ctx) {
          return ctx.action.params.values.phone;
        },
        validate: Boolean,
      });
    });

    it('valid', async () => {
      const res1 = await agent.resource('verifications').create({
        values: {
          type: 'authors:create',
          phone: '1',
        },
      });
      expect(res1.status).toBe(200);
    });

    it('invalid', async () => {
      const res1 = await agent.resource('verifications').create({
        values: {
          type: 'authors:create',
          phone: '',
        },
      });
      expect(res1.status).toBe(400);
    });
  });
});
