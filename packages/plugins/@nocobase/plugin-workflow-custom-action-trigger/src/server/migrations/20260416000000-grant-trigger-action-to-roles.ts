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
 * Grant `trigger` action permission for every role, mirroring the role's existing `view`
 * permission (and its data scope) on each resource.
 *
 * Background: The `trigger` action on collection resources was previously allowed for all
 * logged-in users via `acl.allow('*', ['trigger'], 'loggedIn')`. After that global bypass
 * was removed, `trigger` goes through normal ACL checks. The principle chosen for backward
 * compatibility is: if a role can view a record, it can trigger it — so `trigger` follows
 * `view` exactly.
 *
 * 1. Per-data-source strategy (`dataSourcesRoles.strategy.actions`, an array):
 *    - If the strategy contains `view` (unrestricted), ensure it also contains `trigger`
 *      (unrestricted), replacing any existing scoped `trigger:*` entry.
 *    - If the strategy contains `view:own` (or other scoped form), ensure it contains the
 *      matching `trigger:own`, replacing any divergent existing `trigger` entry.
 *    - If the strategy has no `view` entry at all, leave it alone — the role never had
 *      view permission, so it should not gain trigger permission either.
 *
 * 2. Specific resource configs (`dataSourcesRolesResources` with `usingActionsConfig: true`):
 *    - If the resource has a `view` action entry, create a corresponding `trigger` action
 *      entry that reuses the same `scopeId` (data scope). If a `trigger` entry already
 *      exists, leave it alone.
 *    - If there is no `view` action on the resource, do nothing.
 *
 * This migration runs only during upgrades (appVersion < 2.0.39), not on fresh installs.
 */
export default class extends Migration {
  appVersion = '<2.0.40';
  on = 'afterSync';

  async up() {
    const { db } = this.context;

    await db.sequelize.transaction(async (transaction) => {
      // ── Step 1: mirror view → trigger in per-data-source strategies ───────────────────────
      const dsRoles = await db.getRepository('dataSourcesRoles').find({ transaction });

      for (const dsRole of dsRoles) {
        const strategy: { actions?: string | string[] } = dsRole.get('strategy') || {};
        const actions = strategy.actions;

        // Skip if strategy.actions is `*` (allow-all) or otherwise non-array
        if (!Array.isArray(actions)) {
          continue;
        }

        // Locate the view entry — could be `view` or `view:<scope>` (e.g. `view:own`)
        const viewEntry = actions.find((a) => a === 'view' || a.startsWith('view:'));
        if (!viewEntry) {
          // No view permission → no trigger permission
          continue;
        }

        // Derive the target trigger entry from the view entry
        const targetTrigger = viewEntry === 'view' ? 'trigger' : `trigger:${viewEntry.slice('view:'.length)}`;

        const existingTriggerIndex = actions.findIndex((a) => a === 'trigger' || a.startsWith('trigger:'));

        let newActions: string[];
        if (existingTriggerIndex === -1) {
          newActions = [...actions, targetTrigger];
        } else if (actions[existingTriggerIndex] === targetTrigger) {
          continue; // already matches — nothing to do
        } else {
          newActions = [...actions];
          newActions[existingTriggerIndex] = targetTrigger;
        }

        await db.getRepository('dataSourcesRoles').update({
          filter: {
            roleName: dsRole.get('roleName'),
            dataSourceKey: dsRole.get('dataSourceKey'),
          },
          values: {
            strategy: { ...strategy, actions: newActions },
          },
          hooks: false,
          transaction,
        });
      }

      // ── Step 2: mirror view action → trigger action in specific resource configs ──────────
      const resources = await db.getRepository('dataSourcesRolesResources').find({
        filter: { usingActionsConfig: true },
        appends: ['actions'],
        transaction,
      });

      for (const resource of resources) {
        const actions: Array<{ get(key: string): any }> = resource.get('actions') || [];
        const viewAction = actions.find((a) => a.get('name') === 'view');
        if (!viewAction) {
          continue;
        }

        const hasTrigger = actions.some((a) => a.get('name') === 'trigger');
        if (hasTrigger) {
          continue;
        }

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
    });
  }
}
