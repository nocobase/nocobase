/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { VerificationManager } from '../../verification-manager';
import PluginVerficationServer from '../../Plugin';
import { Verification } from '../../verification';

describe('actions of verificators', async () => {
  describe('not user related', async () => {
    let app: MockServer;
    let agent: any;
    let manager: VerificationManager;

    beforeEach(async () => {
      app = await createMockServer({
        plugins: ['verification'],
      });
      agent = app.agent();
      const plugin = app.pm.get('verification') as PluginVerficationServer;
      manager = plugin.verificationManager;
    });

    afterEach(async () => {
      await app.db.clean({ drop: true });
      await app.destroy();
    });

    it('listTypes', async () => {
      const res = await agent.resource('verificators').listTypes();
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(manager.listTypes());
    });

    it('listByScene', async () => {
      const verificator = await app.db.getRepository('verificators').create({
        values: {
          name: 'test',
          title: 'Test',
          verificationType: 'sms-otp',
        },
      });
      const res = await agent.resource('verificators').listByScene({
        scene: 'test',
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        verificators: [],
        availableTypes: [],
      });
      manager.addSceneRule((scene, verificationType) => scene === 'test' && verificationType === 'sms-otp');
      const res2 = await agent.resource('verificators').listByScene({
        scene: 'test',
      });
      const verificationType = manager.verificationTypes.get('sms-otp');
      expect(res2.status).toBe(200);
      expect(res2.body.data).toMatchObject({
        verificators: [{ name: verificator.name, title: verificator.title }],
        availableTypes: [{ name: 'sms-otp', title: verificationType.title }],
      });
    });
  });

  describe('user related', async () => {
    let app: MockServer;
    let agent: any;
    let manager: VerificationManager;

    beforeEach(async () => {
      app = await createMockServer({
        acl: true,
        plugins: ['verification', 'users', 'field-sort', 'auth'],
      });
      agent = app.agent().loginUsingId(1);
      const plugin = app.pm.get('verification') as PluginVerficationServer;
      manager = plugin.verificationManager;
    });

    afterEach(async () => {
      await app.db.clean({ drop: true });
      await app.destroy();
    });

    it('listByUser', async () => {
      manager.registerVerificationType('test', {
        title: 'Test',
        bindingRequired: true,
        verification: class extends Verification {
          async verify() {}
          async getPublicBoundInfo() {
            return {
              bound: true,
              publicInfo: 'test-uuid',
            };
          }
        },
      });
      const verificators = await app.db.getRepository('verificators').create({
        values: [
          {
            name: 'test',
            verificationType: 'test',
          },
          {
            name: 'sms-otp',
            verificationType: 'sms-otp',
          },
        ],
      });
      await verificators[0].addUser(1, {
        through: {
          uuid: 'test-uuid',
        },
      });
      const res = await agent.resource('verificators').listByUser();
      const smsOTP = manager.verificationTypes.get('sms-otp');
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject([
        {
          title: smsOTP.title,
          name: 'sms-otp',
          boundInfo: {
            bound: false,
          },
        },
        {
          title: 'Test',
          name: 'test',
          boundInfo: {
            bound: true,
            publicInfo: 'test-uuid',
          },
        },
      ]);
    });

    it('listForVerify', async () => {
      manager.registerVerificationType('test', {
        title: 'Test',
        bindingRequired: true,
        verification: class extends Verification {
          async verify() {}
          async getPublicBoundInfo() {
            return {
              bound: true,
              publicInfo: 'test-uuid',
            };
          }
        },
      });
      manager.addSceneRule((scene, verificationType) => scene === 'unbind-verificator' && verificationType === 'test');
      const verificators = await app.db.getRepository('verificators').create({
        values: [
          {
            name: 'test',
            title: 'Test',
            verificationType: 'test',
          },
          {
            name: 'sms-otp',
            verificationType: 'sms-otp',
          },
        ],
      });
      await verificators[0].addUser(1, {
        through: {
          uuid: 'test-uuid',
        },
      });
      const res = await agent.resource('verificators').listForVerify({
        scene: 'unbind-verificator',
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject([
        {
          title: 'Test',
          name: 'test',
          verificationType: 'test',
          verificationTypeTitle: 'Test',
          boundInfo: {
            bound: true,
            publicInfo: 'test-uuid',
          },
        },
      ]);
    });

    it('bind', async () => {
      manager.registerVerificationType('test', {
        title: 'Test',
        bindingRequired: true,
        verification: class extends Verification {
          async verify() {}
          async bind() {
            return {
              uuid: 'test-uuid',
            };
          }
        },
      });
      await app.db.getRepository('verificators').create({
        values: {
          name: 'test',
          title: 'Test',
          verificationType: 'test',
        },
      });
      const res = await agent.resource('verificators').bind({
        values: {
          verificator: 'invalid',
        },
      });
      expect(res.status).toBe(400);
      expect(res.error.text).toBe('Invalid verificator');
      const res1 = await agent.resource('verificators').bind({
        values: {
          verificator: 'test',
        },
      });
      expect(res1.status).toBe(200);
      const record = await manager.getBoundRecord(1, 'test');
      expect(record).toBeDefined();
      expect(record.uuid).toBe('test-uuid');
      expect(record.verificator).toBe('test');
      expect(record.userId).toBe(1);
      const res2 = await agent.resource('verificators').bind({
        values: {
          verificator: 'test',
        },
      });
      expect(res2.status).toBe(400);
      expect(res2.error.text).toBe('You have already bound this verificator');
    });

    it('unbind', async () => {
      manager.registerVerificationType('test', {
        title: 'Test',
        bindingRequired: true,
        verification: class extends Verification {
          async verify() {}
          async bind() {
            return {
              uuid: 'test-uuid',
            };
          }
        },
      });
      manager.addSceneRule((scene, verificationType) => scene === 'unbind-verificator' && verificationType === 'test');
      await app.db.getRepository('verificators').create({
        values: {
          name: 'test',
          title: 'Test',
          verificationType: 'test',
        },
      });
      await agent.resource('verificators').bind({
        values: {
          verificator: 'test',
        },
      });
      const res = await agent.resource('verificators').unbind({
        values: {
          verificator: 'test',
          unbindVerificator: 'invalid',
        },
      });
      expect(res.status).toBe(400);
      expect(res.error.text).toBe('Invalid verificator');
      const res1 = await agent.resource('verificators').unbind({
        values: {
          unbindVerificator: 'test',
          verificator: 'test',
        },
      });
      expect(res1.status).toBe(200);
      const record = await manager.getBoundRecord(1, 'test');
      expect(record).toBeNull();
    });
  });
});
