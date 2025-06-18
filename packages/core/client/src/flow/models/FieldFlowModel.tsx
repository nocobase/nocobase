/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, FlowModel } from '@nocobase/flow-engine';

// null 表示不支持任何字段接口，* 表示支持所有字段接口
export type SupportedFieldInterfaces = string[] | '*' | null;

export class FieldFlowModel extends FlowModel {
  field: CollectionField;
  fieldPath: string;
  public static readonly supportedFieldInterfaces: SupportedFieldInterfaces = null;
}
