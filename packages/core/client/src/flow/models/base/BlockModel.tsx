/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIResource, BaseRecordResource, Collection, DefaultStructure, FlowModel } from '@nocobase/flow-engine';

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {}

export class DataBlockModel<T = DefaultStructure> extends BlockModel<T> {
  resource: APIResource;
  collection: Collection;

  onInit() {
    this.setSharedContext({
      currentBlockModel: this,
    });
    console.log('DataBlockModel onInit', this);
  }

  addAppends(fieldPath: string, refresh = false) {
    const field = this.ctx.globals.dataSourceManager.getCollectionField(
      `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
    );
    if (!field) {
      throw new Error(
        `Collection field not found: ${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
      );
    }
    if (['belongsToMany', 'belongsTo', 'hasMany', 'hasOne'].includes(field.type)) {
      (this.resource as BaseRecordResource).addAppends(field.name);
      if (refresh) {
        this.resource.refresh();
      }
    }
  }
}

export class FilterBlockModel<T = DefaultStructure> extends BlockModel<T> {}
