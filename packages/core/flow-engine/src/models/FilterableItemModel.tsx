/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldModel, FlowModel } from '.';
import { CollectionField, FlowEngineContext } from '..';
import type { DefaultStructure } from '../types';

export class FilterableItemModel<T extends DefaultStructure = DefaultStructure> extends FlowModel<T> {
  static bindModelToInterface(
    modelName: string,
    interfaceName: string | string[],
    options: {
      isDefault?: boolean;
      defaultProps?: object | ((ctx: FlowEngineContext, fieldInstance: CollectionField) => object);
      when?: (ctx: FlowEngineContext, fieldInstance: CollectionField) => boolean;
    } = {},
  ) {
    return CollectionFieldModel.bindModelToInterface(modelName, interfaceName, options);
  }
}
