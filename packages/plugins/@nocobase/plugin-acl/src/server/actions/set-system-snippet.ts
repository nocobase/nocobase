/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';

const systemSnippets = new Set(['ui.*', 'pm', 'pm.*', 'app']);

export async function setSystemSnippet(ctx: Context, next: Next) {
  const { filterByTk, values } = ctx.action.params;
  const snippet: unknown = values?.snippet;
  const enabled: unknown = values?.enabled;
  if (
    typeof filterByTk !== 'string' ||
    typeof snippet !== 'string' ||
    !systemSnippets.has(snippet) ||
    typeof enabled !== 'boolean'
  ) {
    ctx.throw(400, ctx.t('Invalid system permission', { ns: 'acl' }));
  }

  ctx.body = await ctx.db.sequelize.transaction(async (transaction) => {
    const repository = ctx.db.getRepository('roles');
    const role = await repository.findOne({ filterByTk, transaction, lock: transaction.LOCK.UPDATE });
    if (!role) {
      ctx.throw(404, ctx.t('Role not found', { ns: 'acl' }));
    }
    const current: unknown = role.get('snippets');
    const snippets = Array.isArray(current)
      ? current.filter((value): value is string => typeof value === 'string')
      : [];
    const nextSnippets = [
      ...snippets.filter((value) => value !== snippet && value !== `!${snippet}`),
      enabled ? snippet : `!${snippet}`,
    ];
    if (snippets.length !== nextSnippets.length || nextSnippets.some((value) => !snippets.includes(value))) {
      await repository.update({ filterByTk, values: { snippets: nextSnippets }, transaction, context: ctx });
    }
    return nextSnippets;
  });
  await next();
}
