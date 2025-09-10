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
import { CollectionBlockModel } from './BlockModel';

// null 表示不支持任何字段接口，* 表示支持所有字段接口
export type SupportedFieldInterfaces = string[] | '*' | null;

export type FilterSupportedFields = (field: CollectionField) => boolean;

/**
 * @deprecated
 */
export interface FieldSettingsInitParams {
  dataSourceKey: string;
  collectionName: string;
  fieldPath: string;
}

export class FieldModel<T = DefaultStructure> extends FlowModel<T> {
  /**
   * @deprecated
   */
  declare field: any; // TODO: remove it after field has been refactored!! this is used to by pass build error

  // 设置态隐藏时的占位渲染
  protected renderHiddenInConfig(): React.ReactNode | undefined {
    return <Input variant={'borderless'} value={this.context.t('Permission denied')} readOnly disabled />;
  }

  /**
   * @deprecated
   */
  onInit(options: any): void {
    // this.context.defineProperty('collectionField', {
    //   get: () => {
    //     const params = this.getFieldSettingsInitParams();
    //     if (!params || !params.dataSourceKey) {
    //       // 当字段初始化参数尚未就绪时，返回 undefined，避免运行期错误
    //       console.error('Invalid field step parmas!', this.uid);
    //       return undefined;
    //     }
    //     const collectionField = this.context.dataSourceManager.getCollectionField(
    //       `${params.dataSourceKey}.${params.collectionName}.${params.fieldPath}`,
    //     ) as CollectionField;
    //     return collectionField;
    //   },
    // });
  }

  getFieldSettingsInitParams(): FieldSettingsInitParams {
    return this.getStepParams('fieldSettings', 'init');
  }

  /**
   * @deprecated
   */
  get fieldPath(): string {
    return this.getFieldSettingsInitParams().fieldPath;
  }

  get collectionField() {
    return this.context.collectionField as CollectionField;
  }

  public static readonly supportedFieldInterfaces: SupportedFieldInterfaces = null;
}

FieldModel.registerFlow({
  key: 'fieldSettings',
  title: escapeT('Field settings'),
  steps: {
    init: {
      handler(ctx, params) {
        const { dataSourceKey, collectionName, fieldPath } = params;
        if (!Object.keys(params).length) {
          return;
        }
        if (!dataSourceKey) {
          throw new Error('dataSourceKey is a required parameter');
        }
        if (!collectionName) {
          throw new Error('collectionName is a required parameter');
        }
        if (!fieldPath) {
          throw new Error('fieldPath is a required parameter');
        }
        const blockModel = ctx.blockModel as CollectionBlockModel;
        if (!blockModel) {
          throw new Error('Current block model is not set in model context');
        }
        if (!ctx.model.parent) {
          throw new Error('FieldModel must have a parent model');
        }
        blockModel.addAppends(fieldPath);
      },
    },
  },
});
