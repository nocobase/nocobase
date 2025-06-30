/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIResource, BaseRecordResource, Collection, DefaultStructure, FlowModel } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {
  decoratorProps: Record<string, any> = {};

  renderComponent() {
    throw new Error('renderComponent method must be implemented in subclasses of BlockModel');
    return null;
  }

  render() {
    return <Card {...this.decoratorProps}>{this.renderComponent()}</Card>;
  }
}

export class DataBlockModel<T = DefaultStructure> extends BlockModel<T> {
  resource: APIResource;
  collection: Collection;

  onInit(options) {
    this.setSharedContext({
      currentBlockModel: this,
    });
  }

  get title() {
    return (
      this._title ||
      `
    ${this.collection.title} -> 
    ${this.collection.dataSource.displayName} -> 
    ${this.translate(this.constructor['meta']?.title || this.constructor.name)}`
    );
  }

  addAppends(fieldPath: string, refresh = false) {
    const field = this.ctx.globals.dataSourceManager.getCollectionField(
      `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
    );
    if (!field) {
      return;
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
