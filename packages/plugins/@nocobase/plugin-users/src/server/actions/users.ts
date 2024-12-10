/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, DEFAULT_PAGE, DEFAULT_PER_PAGE, Next } from '@nocobase/actions';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import _ from 'lodash';

function parseProfileFormSchema(schema: any) {
  const properties = _.get(schema, 'properties.form.properties.edit.properties.grid.properties') || {};
  const fields = Object.values(properties).map((row: any) => {
    const col = Object.values(row.properties)[0] as any;
    const [name, props] = Object.entries(col.properties)[0];
    return !props['x-read-pretty'] && !props['x-disable'] ? name : null;
  });
  return fields.filter(Boolean).filter((field) => !['roles'].includes(field));
}

export async function updateProfile(ctx: Context, next: Next) {
  const values = ctx.action.params.values || {};
  const { currentUser } = ctx.state;
  if (!currentUser) {
    ctx.throw(401);
  }
  const schemaRepo = ctx.db.getRepository<UiSchemaRepository>('uiSchemas');
  const schema = await schemaRepo.getJsonSchema('nocobase-user-profile-edit-form');
  const fields = parseProfileFormSchema(schema);
  const UserRepo = ctx.db.getRepository('users');
  const result = await UserRepo.update({
    filterByTk: currentUser.id,
    values: _.pick(values, [...fields, 'systemSettings', 'appLang']),
  });
  ctx.body = result;
  await next();
}

export const listExcludeRole = async (ctx: Context, next: Next) => {
  const { roleName, page = DEFAULT_PAGE, pageSize = DEFAULT_PER_PAGE } = ctx.action.params;
  const repo = ctx.db.getRepository('users');
  const users = await repo.find({
    fields: ['id'],
    filter: {
      'roles.name': roleName,
    },
  });
  const userIds = users.map((user: { id: number }) => user.id);
  if (userIds.length) {
    ctx.action.mergeParams({
      filter: {
        id: {
          $notIn: userIds,
        },
      },
    });
  }
  const { filter } = ctx.action.params;
  const [rows, count] = await repo.findAndCount({
    context: ctx,
    offset: (page - 1) * pageSize,
    limit: +pageSize,
    filter,
  });
  ctx.body = {
    count,
    rows,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPage: Math.ceil(count / pageSize),
  };
  await next();
};
