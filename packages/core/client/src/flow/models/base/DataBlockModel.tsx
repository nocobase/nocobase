/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { buildSubModelItems, DefaultStructure, escapeT } from '@nocobase/flow-engine';
import _ from 'lodash';
import { BlockModel } from './BlockModel';

export class DataBlockModel<T = DefaultStructure> extends BlockModel<T> {}

DataBlockModel.define({
  hide: true,
  label: escapeT('Data blocks'),
  async children(ctx) {
    const children = await buildSubModelItems(DataBlockModel)(ctx);
    const { collectionName, filterByTk, scene } = ctx.view.inputArgs;
    return children.filter((item) => {
      const M = ctx.engine.getModelClass(item.useModel);
      if (scene === 'select') {
        return M['_isScene']?.('select');
      }
      if (scene === 'new' || (collectionName && !filterByTk)) {
        return M['_isScene']?.('new');
      }
      return !M['_isScene'] || !M['_isScene']?.('select');
    });
  },
});
