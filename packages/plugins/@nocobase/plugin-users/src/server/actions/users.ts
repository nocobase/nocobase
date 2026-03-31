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
import { namespace } from '..';
import { ValidationError, ValidationErrorItem } from 'sequelize';

function findNonVoidTypeObjects(obj: any, path = '', results = []): { name: string; props: any }[] {
  for (const key in obj) {
    const value = obj[key];

    const currentPath = path ? `${path}.${key}` : key;

    if (value && typeof value === 'object') {
      if (value.type && value.type !== 'void') {
        results.push({
          name: key,
          props: value,
        });
      }

      if (value.properties) {
        findNonVoidTypeObjects(value.properties, `${currentPath}.properties`, results);
      } else {
        findNonVoidTypeObjects(value, currentPath, results);
      }
    }
  }

  return results;
}

function parseProfileFormSchema(schema: any) {
  const properties = _.get(schema, 'properties.form.properties.edit.properties.grid.properties') || {};
  const fields = [];
  const requiredFields = [];
  const configs = findNonVoidTypeObjects(properties);
  Object.values(configs).forEach(({ name, props }) => {
    if (props['x-read-pretty'] || props['x-disabled']) {
      return;
    }
    if (props['required']) {
      requiredFields.push(name);
    }
    fields.push(name);
  });
  return { fields, requiredFields };
}

export async function updateProfile(ctx: Context, next: Next) {
  const systemSettings = ctx.db.getRepository('systemSettings');
  const settings = await systemSettings.findOne();
  const enableEditProfile = settings.get('enableEditProfile');
  if (enableEditProfile === false) {
    ctx.throw(403, ctx.t('User profile is not allowed to be edited', { ns: namespace }));
  }

  const values = ctx.action.params.values || {};
  const { currentUser } = ctx.state;
  if (!currentUser) {
    ctx.throw(401);
  }
  const schemaRepo = ctx.db.getRepository<UiSchemaRepository>('uiSchemas');
  const schema = await schemaRepo.getJsonSchema('nocobase-user-profile-edit-form');
  const { fields, requiredFields } = parseProfileFormSchema(schema);
  const userRepo = ctx.db.getRepository('users');
  const user = await userRepo.findOne({ filter: { id: currentUser.id } });
  for (const field of requiredFields) {
    if (!values[field]) {
      // Throw a sequelize validation error and it will be caught by the error handler
      // so that the field name in error message will be translated
      throw new ValidationError(`${field} can not be null`, [
        new ValidationErrorItem(
          `${field} can not be null`,
          // @ts-ignore
          'notNull violation',
          field,
          null,
          user,
          'is_null',
          null,
          null,
        ),
      ]);
    }
  }

  const result = await userRepo.update({
    filterByTk: currentUser.id,
    values: _.pick(values, fields),
  });
  ctx.body = result;
  await next();
}

export async function updateLang(ctx: Context, next: Next) {
  const { appLang } = ctx.action.params.values || {};
  const { currentUser } = ctx.state;
  if (!currentUser) {
    ctx.throw(401);
  }
  const userRepo = ctx.db.getRepository('users');
  await userRepo.update({
    filterByTk: currentUser.id,
    values: {
      appLang,
    },
  });
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

export const getSystemSettings = async (ctx: Context, next: Next) => {
  const systemSettings = ctx.db.getRepository('systemSettings');
  const settings = await systemSettings.findOne();
  ctx.body = {
    enableEditProfile: settings.get('enableEditProfile'),
    enableChangePassword: settings.get('enableChangePassword'),
  };
  await next();
};

export const updateSystemSettings = async (ctx: Context, next: Next) => {
  const { enableEditProfile, enableChangePassword } = ctx.action.params.values || {};
  const systemSettings = ctx.db.getRepository('systemSettings');
  const values = {};
  if (enableEditProfile !== undefined) {
    values['enableEditProfile'] = enableEditProfile;
  }
  if (enableChangePassword !== undefined) {
    values['enableChangePassword'] = enableChangePassword;
  }
  if (!Object.keys(values).length) {
    ctx.throw(400);
  }
  await systemSettings.update({
    filterByTk: 1,
    values,
  });
  await next();
};
