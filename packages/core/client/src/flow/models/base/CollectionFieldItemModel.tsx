/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, DefaultStructure, escapeT, FlowModel } from '@nocobase/flow-engine';
import { Input } from 'antd';
import React from 'react';

export interface FieldSettingsInitParams {
  dataSourceKey: string;
  collectionName: string;
  fieldPath: string;
  associationPathName?: string;
}

export class CollectionFieldItemModel<T = DefaultStructure> extends FlowModel<T> {
  renderHiddenInConfig(): React.ReactNode | undefined {
    return <Input variant={'borderless'} value={this.context.t('Permission denied')} readOnly disabled />;
  }

  onInit(options: any): void {
    this.context.defineProperty('collectionField', {
      get: () => {
        const params = this.getFieldSettingsInitParams();
        const collectionField = this.context.dataSourceManager.getCollectionField(
          `${params.dataSourceKey}.${params.collectionName}.${params.fieldPath}`,
        ) as CollectionField;
        return collectionField;
      },
    });
    this.context.blockModel.addAppends(this.fieldPath);
    this.context.blockModel.addAppends(this.associationPathName);
  }

  getFieldSettingsInitParams(): FieldSettingsInitParams {
    return this.getStepParams('fieldSettings', 'init');
  }

  get fieldPath(): string {
    return this.getFieldSettingsInitParams().fieldPath;
  }

  get associationPathName(): string {
    return this.getFieldSettingsInitParams().associationPathName;
  }

  get collectionField() {
    return this.context.collectionField as CollectionField;
  }
}

CollectionFieldItemModel.registerFlow({
  key: 'fieldSettings',
  title: escapeT('Field settings'),
  steps: {
    init: {
      handler(ctx, params) {
        const { dataSourceKey, collectionName, fieldPath } = params;
        if (!dataSourceKey) {
          throw new Error('dataSourceKey is a required parameter');
        }
        if (!collectionName) {
          throw new Error('collectionName is a required parameter');
        }
        if (!fieldPath) {
          throw new Error('fieldPath is a required parameter');
        }
      },
    },
  },
});
