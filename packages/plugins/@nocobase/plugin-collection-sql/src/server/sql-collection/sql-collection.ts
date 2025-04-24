/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, CollectionContext, CollectionOptions } from '@nocobase/database';
import { SQLModel } from './sql-model';
import { QueryInterfaceDropTableOptions } from 'sequelize';

export class SQLCollection extends Collection {
  constructor(options: CollectionOptions, context: CollectionContext) {
    options.autoGenId = false;
    options.timestamps = false;
    options.underscored = false;

    super(options, context);
  }

  /* istanbul ignore next -- @preserve */
  get filterTargetKey() {
    const targetKey = this.options?.filterTargetKey || 'id';
    if (Array.isArray(targetKey)) {
      return targetKey;
    }

    if (targetKey && this.model.getAttributes()[targetKey]) {
      return targetKey;
    }

    if (this.model.primaryKeyAttributes.length > 1) {
      return null;
    }
    return this.model.primaryKeyAttribute;
  }

  isSql() {
    return true;
  }

  unavailableActions(): Array<string> {
    return ['create', 'update', 'destroy', 'importXlsx', 'destroyMany', 'updateMany'];
  }

  public collectionSchema() {
    return undefined;
  }

  modelInit() {
    const { autoGenId, sql } = this.options;
    const model = class extends SQLModel {};
    model.init(null, {
      ...this.sequelizeModelOptions(),
      schema: undefined,
    });

    if (!autoGenId) {
      model.removeAttribute('id');
    }

    model.sql = sql?.endsWith(';') ? sql.slice(0, -1) : sql;
    model.database = this.context.database;
    model.collection = this;

    this.model = new Proxy(model, {
      get(target, prop) {
        if (prop === '_schema') {
          return undefined;
        }
        return Reflect.get(target, prop);
      },
    });
  }

  async removeFromDb(options?: QueryInterfaceDropTableOptions & { dropCollection?: boolean }) {
    if (options?.dropCollection !== false) {
      return this.remove();
    }
  }
}
