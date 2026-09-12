/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

/**
 * Grant `trigger` / `triggerNew` action permissions for every role, mirroring the role's
 * existing `view` / `create` permissions.
 *
 * Background: The `trigger` action on collection resources was previously allowed for all
 * logged-in users via `acl.allow('*', ['trigger'], 'loggedIn')`. After that global bypass
 * was removed, `trigger` goes through normal ACL checks. Custom-action trigger is now
 * modelled as two ACL actions:
 *   - `trigger` — invoked on an existing record; follows `view` (with data scope).
 *   - `triggerNew` — invoked on a form that hasn't been persisted yet; follows `create`.
 *
 * 1. Per-data-source strategy (`dataSourcesRoles.strategy.actions`, an array):
 *    - `trigger` mirrors `view` (including scope suffix like `:own`). No `view` → no trigger.
 *    - `triggerNew` is added (unrestricted) if the strategy contains any `create*` entry.
 *      No `create` → no triggerNew. Scope suffixes on `create` are ignored because new-data
 *      actions have no data scope.
 *
 * 2. Specific resource configs (`dataSourcesRolesResources` with `usingActionsConfig: true`):
 *    - If the resource has a `view` action, create a matching `trigger` action that reuses
 *      the same `scopeId`. Skip if `trigger` already exists.
 *    - If the resource has a `create` action, create a matching `triggerNew` action
 *      (scopeId: null — new-data actions carry no scope). Skip if `triggerNew` already
 *      exists.
 *
 * This migration runs only during upgrades (appVersion < 2.0.40), not on fresh installs.
 */
export default class extends Migration {
  appVersion = '<2.1.0-alpha.21';
  on = 'afterSync';

  async up() {
    const { db } = this.context;

    await db.sequelize.transaction(async (transaction) => {
      // ── Step 1: mirror view → trigger / create → triggerNew in per-data-source strategies ─
      const dsRoles = await db.getRepository('dataSourcesRoles').find({ transaction });

      for (const dsRole of dsRoles) {
        const strategy: { actions?: string | string[] } = dsRole.get('strategy') || {};
        const actions = strategy.actions;

        // Skip if strategy.actions is `*` (allow-all) or otherwise non-array
        if (!Array.isArray(actions)) {
          continue;
        }

        let nextActions: string[] | null = null;
        const ensureNextActions = () => {
          if (!nextActions) nextActions = [...actions];
          return nextActions;
        };

        // 1a. trigger follows view (including scope suffix)
        const viewEntry = actions.find((a) => a === 'view' || a.startsWith('view:'));
        if (viewEntry) {
          const targetTrigger = viewEntry === 'view' ? 'trigger' : `trigger:${viewEntry.slice('view:'.length)}`;
          const existingIndex = actions.findIndex((a) => a === 'trigger' || a.startsWith('trigger:'));
          if (existingIndex === -1) {
            ensureNextActions().push(targetTrigger);
          } else if (actions[existingIndex] !== targetTrigger) {
            ensureNextActions()[existingIndex] = targetTrigger;
          }
        }

        // 1b. triggerNew follows create (unrestricted — new-data actions have no scope)
        const hasCreate = actions.some((a) => a === 'create' || a.startsWith('create:'));
        if (hasCreate) {
          const existingIndex = actions.findIndex((a) => a === 'triggerNew' || a.startsWith('triggerNew:'));
          if (existingIndex === -1) {
            ensureNextActions().push('triggerNew');
          } else if (actions[existingIndex] !== 'triggerNew') {
            ensureNextActions()[existingIndex] = 'triggerNew';
          }
        }

        if (nextActions) {
          await db.getRepository('dataSourcesRoles').update({
            filter: {
              roleName: dsRole.get('roleName'),
              dataSourceKey: dsRole.get('dataSourceKey'),
            },
            values: {
              strategy: { ...strategy, actions: nextActions },
            },
            hooks: false,
            transaction,
          });
        }
      }

      // ── Step 2: mirror view → trigger / create → triggerNew in specific resource configs ──
      const resources = await db.getRepository('dataSourcesRolesResources').find({
        filter: { usingActionsConfig: true },
        appends: ['actions'],
        transaction,
      });

      for (const resource of resources) {
        const actions: Array<{ get(key: string): any }> = resource.get('actions') || [];

        const viewAction = actions.find((a) => a.get('name') === 'view');
        const hasTrigger = actions.some((a) => a.get('name') === 'trigger');
        if (viewAction && !hasTrigger) {
          await db.getRepository('dataSourcesRolesResourcesActions').create({
            values: {
              rolesResourceId: resource.get('id'),
              name: 'trigger',
              scopeId: viewAction.get('scopeId') ?? null,
              fields: [],
            },
            transaction,
          });
        }

        const createAction = actions.find((a) => a.get('name') === 'create');
        const hasTriggerNew = actions.some((a) => a.get('name') === 'triggerNew');
        if (createAction && !hasTriggerNew) {
          await db.getRepository('dataSourcesRolesResourcesActions').create({
            values: {
              rolesResourceId: resource.get('id'),
              name: 'triggerNew',
              scopeId: null,
              fields: [],
            },
            transaction,
          });
        }
      }
    });
  }
}
