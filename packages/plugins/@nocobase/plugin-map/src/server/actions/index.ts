/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { MapConfigurationCollectionName } from '../constants';

export const getConfiguration = async (ctx: Context, next) => {
  const {
    params: { type, isRaw },
  } = ctx.action;

  const repo = ctx.db.getRepository(MapConfigurationCollectionName);
  const record = await repo.findOne({
    filter: {
      type,
    },
  });
  const body = record ? record.toJSON() : {};
  ctx.body = isRaw === true || isRaw === 'true' ? body : ctx.app.environment.renderJsonTemplate(body);
  return next();
};

export const setConfiguration = async (ctx: Context, next) => {
  const { params: values } = ctx.action;
  const repo = ctx.db.getRepository(MapConfigurationCollectionName);
  const record = await repo.findOne({
    filter: {
      type: values.type,
    },
  });

  if (record) {
    await repo.update({
      values,
      filter: {
        type: values.type,
      },
    });
  } else {
    await repo.create({
      values,
    });
  }

  ctx.body = 'ok';
  return next();
};
