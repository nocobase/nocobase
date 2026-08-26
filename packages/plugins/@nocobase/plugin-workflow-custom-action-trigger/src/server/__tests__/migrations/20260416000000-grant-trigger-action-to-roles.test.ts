/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import Migration from '../../migrations/20260416000000-grant-trigger-action-to-roles';

describe('migration: 20260416000000-grant-trigger-action-to-roles', () => {
  let app: MockServer;
  let db;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    db = app.db;
  });

  afterEach(() => app.destroy());

  // ── Helpers ──────────────────────────────────────────────────────────────────
  /**
   * Create a test role and set its dataSourcesRoles entry for the 'main' datasource.
   * Note: roles.afterSaveWithAssociations hook auto-creates a dataSourcesRoles record
   * with null strategy, so we use updateOrCreate (hooks: false) to set the strategy
   * without triggering a recursive sync back to the roles table.
   */
  async function createDsRole(roleName: string, strategyActions: string[] | string) {
    await db.getRepository('roles').create({ values: { name: roleName, title: roleName } });
    await db.getRepository('dataSourcesRoles').updateOrCreate({
      filterKeys: ['roleName', 'dataSourceKey'],
      values: {
        roleName,
        dataSourceKey: 'main',
        strategy: { actions: strategyActions },
      },
      hooks: false,
    } as any);
  }

  /** Create a dataSourcesRolesResources entry for 'main' datasource + 'member' role. */
  async function createResource(
    resourceName: string,
    usingActionsConfig: boolean,
    actions: Array<{ name: string; scopeId?: number | null }> = [],
  ) {
    const resource = await db.getRepository('dataSourcesRolesResources').create({
      values: {
        roleName: 'member',
        dataSourceKey: 'main',
        name: resourceName,
        usingActionsConfig,
      },
    });
    for (const { name, scopeId } of actions) {
      await db.getRepository('dataSourcesRolesResourcesActions').create({
        values: { rolesResourceId: resource.get('id'), name, scopeId: scopeId ?? null, fields: [] },
      });
    }
    return resource;
  }

  async function createScope(name = 'scope-a') {
    return db.getRepository('dataSourcesRolesResourcesScopes').create({
      values: {
        dataSourceKey: 'main',
        resourceName: 'posts',
        name,
        scope: { id: { $gt: 0 } },
      },
    });
  }

  // ── Step 1: strategy-based permissions ───────────────────────────────────────

  describe('Step 1: strategy-based permissions', () => {
    it('should add unrestricted trigger when strategy has unrestricted view but no trigger', async () => {
      await createDsRole('roleA', ['create', 'view', 'list']);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleA', dataSourceKey: 'main' },
      });
      const actions: string[] = dsRole.get('strategy').actions;
      expect(actions).toContain('trigger');
      expect(actions).not.toContain('trigger:own');
      // original actions preserved
      expect(actions).toContain('create');
      expect(actions).toContain('view');
    });

    it('should add trigger:own when strategy has view:own but no trigger', async () => {
      await createDsRole('roleA2', ['create', 'view:own']);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleA2', dataSourceKey: 'main' },
      });
      const actions: string[] = dsRole.get('strategy').actions;
      expect(actions).toContain('trigger:own');
      expect(actions).not.toContain('trigger');
    });

    it('should replace trigger:own with unrestricted trigger when view is unrestricted', async () => {
      await createDsRole('roleB', ['view', 'trigger:own']);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleB', dataSourceKey: 'main' },
      });
      const actions: string[] = dsRole.get('strategy').actions;
      expect(actions).toContain('trigger');
      expect(actions).not.toContain('trigger:own');
    });

    it('should downgrade unrestricted trigger to trigger:own when view is view:own', async () => {
      await createDsRole('roleB2', ['view:own', 'trigger']);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleB2', dataSourceKey: 'main' },
      });
      const actions: string[] = dsRole.get('strategy').actions;
      expect(actions).toContain('trigger:own');
      expect(actions.filter((a) => a === 'trigger').length).toBe(0);
    });

    it('should not modify strategy when existing trigger already matches view scope', async () => {
      await createDsRole('roleC', ['view', 'trigger']);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleC', dataSourceKey: 'main' },
      });
      const actions: string[] = dsRole.get('strategy').actions;
      expect(actions.filter((a) => a === 'trigger').length).toBe(1);
    });

    it('should skip a role whose strategy actions is "*" (non-array)', async () => {
      await createDsRole('roleD', '*' as any);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleD', dataSourceKey: 'main' },
      });
      expect(dsRole.get('strategy').actions).toBe('*');
    });

    it('should not derive trigger when strategy has no view entry', async () => {
      await createDsRole('roleE', ['list']);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleE', dataSourceKey: 'main' },
      });
      const actions: string[] = dsRole.get('strategy').actions;
      expect(actions).not.toContain('trigger');
      expect(actions).not.toContain('trigger:own');
    });

    it('should add triggerNew when strategy has create', async () => {
      await createDsRole('roleF', ['create', 'list']);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleF', dataSourceKey: 'main' },
      });
      const actions: string[] = dsRole.get('strategy').actions;
      expect(actions).toContain('triggerNew');
      expect(actions).toContain('create');
    });

    it('should not add triggerNew when strategy has no create', async () => {
      await createDsRole('roleG', ['view']);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleG', dataSourceKey: 'main' },
      });
      const actions: string[] = dsRole.get('strategy').actions;
      expect(actions).not.toContain('triggerNew');
    });

    it('should not duplicate triggerNew when strategy already has it', async () => {
      await createDsRole('roleH', ['create', 'triggerNew']);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleH', dataSourceKey: 'main' },
      });
      const actions: string[] = dsRole.get('strategy').actions;
      expect(actions.filter((a) => a === 'triggerNew').length).toBe(1);
    });

    it('should derive both trigger and triggerNew when strategy has view and create', async () => {
      await createDsRole('roleI', ['view', 'create']);

      await new Migration({ db, app } as any).up();

      const dsRole = await db.getRepository('dataSourcesRoles').findOne({
        filter: { roleName: 'roleI', dataSourceKey: 'main' },
      });
      const actions: string[] = dsRole.get('strategy').actions;
      expect(actions).toContain('trigger');
      expect(actions).toContain('triggerNew');
    });
  });

  // ── Step 2: resource-specific action configs ──────────────────────────────────

  describe('Step 2: resource-specific action configs', () => {
    it('should add trigger action mirroring the view action (no scope)', async () => {
      const resource = await createResource('posts', true, [{ name: 'view' }, { name: 'create' }]);

      await new Migration({ db, app } as any).up();

      const actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: { rolesResourceId: resource.get('id') },
      });
      const triggerAction = actions.find((a) => a.get('name') === 'trigger');
      expect(triggerAction).toBeTruthy();
      expect(triggerAction.get('scopeId')).toBeFalsy();
    });

    it('should copy the view action scopeId onto the new trigger action', async () => {
      const scope = await createScope();
      const resource = await createResource('posts', true, [{ name: 'view', scopeId: scope.get('id') }]);

      await new Migration({ db, app } as any).up();

      const actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: { rolesResourceId: resource.get('id') },
      });
      const triggerAction = actions.find((a) => a.get('name') === 'trigger');
      expect(triggerAction).toBeTruthy();
      expect(String(triggerAction.get('scopeId'))).toBe(String(scope.get('id')));
    });

    it('should not add trigger when the resource has no view action', async () => {
      const resource = await createResource('noView', true, [{ name: 'create' }, { name: 'update' }]);

      await new Migration({ db, app } as any).up();

      const actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: { rolesResourceId: resource.get('id') },
      });
      expect(actions.find((a) => a.get('name') === 'trigger')).toBeUndefined();
    });

    it('should not duplicate trigger if it already exists in resource actions', async () => {
      const resource = await createResource('orders', true, [{ name: 'view' }, { name: 'trigger' }]);

      await new Migration({ db, app } as any).up();

      const actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: { rolesResourceId: resource.get('id') },
      });
      expect(actions.filter((a) => a.get('name') === 'trigger').length).toBe(1);
    });

    it('should not add trigger to a resource with usingActionsConfig=false', async () => {
      const resource = await createResource('comments', false, []);

      await new Migration({ db, app } as any).up();

      const actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: { rolesResourceId: resource.get('id') },
      });
      expect(actions.length).toBe(0);
    });

    it('should add trigger to every view-bearing resource across multiple resources', async () => {
      const r1 = await createResource('tableA', true, [{ name: 'view' }]);
      const r2 = await createResource('tableB', true, [{ name: 'view' }, { name: 'update' }]);
      const r3 = await createResource('tableC', true, [{ name: 'update' }]); // no view → no trigger

      await new Migration({ db, app } as any).up();

      for (const r of [r1, r2]) {
        const actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
          filter: { rolesResourceId: r.get('id') },
        });
        expect(actions.map((a) => a.get('name'))).toContain('trigger');
      }

      const r3Actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: { rolesResourceId: r3.get('id') },
      });
      expect(r3Actions.map((a) => a.get('name'))).not.toContain('trigger');
    });

    it('should add triggerNew when resource has create action, without scope', async () => {
      const resource = await createResource('formA', true, [{ name: 'create' }]);

      await new Migration({ db, app } as any).up();

      const actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: { rolesResourceId: resource.get('id') },
      });
      const triggerNewAction = actions.find((a) => a.get('name') === 'triggerNew');
      expect(triggerNewAction).toBeTruthy();
      expect(triggerNewAction.get('scopeId')).toBeFalsy();
    });

    it('should not add triggerNew when resource has no create action', async () => {
      const resource = await createResource('formB', true, [{ name: 'view' }]);

      await new Migration({ db, app } as any).up();

      const actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: { rolesResourceId: resource.get('id') },
      });
      expect(actions.find((a) => a.get('name') === 'triggerNew')).toBeUndefined();
    });

    it('should not duplicate triggerNew if it already exists', async () => {
      const resource = await createResource('formC', true, [{ name: 'create' }, { name: 'triggerNew' }]);

      await new Migration({ db, app } as any).up();

      const actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: { rolesResourceId: resource.get('id') },
      });
      expect(actions.filter((a) => a.get('name') === 'triggerNew').length).toBe(1);
    });

    it('should add both trigger and triggerNew when resource has view and create', async () => {
      const resource = await createResource('formD', true, [{ name: 'view' }, { name: 'create' }]);

      await new Migration({ db, app } as any).up();

      const actions = await db.getRepository('dataSourcesRolesResourcesActions').find({
        filter: { rolesResourceId: resource.get('id') },
      });
      const names = actions.map((a) => a.get('name'));
      expect(names).toContain('trigger');
      expect(names).toContain('triggerNew');
    });
  });
});
