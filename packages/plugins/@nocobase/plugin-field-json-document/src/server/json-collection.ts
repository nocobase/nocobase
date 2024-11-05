/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, CollectionContext, CollectionOptions } from '@nocobase/database';
import { JSONModel } from './json-model';

export class JSONCollection extends Collection {
  constructor(options: CollectionOptions, context: CollectionContext) {
    options.autoGenId = false;
    options.timestamps = false;
    options.underscored = false;

    super(options, context);
  }

  public collectionSchema() {
    return undefined;
  }

  availableActions() {
    return ['view'];
  }

  modelInit() {
    const model = class extends JSONModel {};
    model.init(null, {
      ...this.sequelizeModelOptions(),
      schema: undefined,
    });

    model.removeAttribute('id');
    model.database = this.context.database;
    model.collection = this;

    this.model = model;
  }
}
