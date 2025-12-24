/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { ActionModel } from '../../../../base/ActionModel';
import { TableBlockModel } from '../../../../blocks/table/TableBlockModel';

export class SubTableEditActionModel extends ActionModel {
  defaultPopupTitle = tExpr('Edit');
  defaultProps: ButtonProps = {
    title: tExpr('Edit'),
  };

  getAclActionName() {
    return 'update';
  }
}

SubTableEditActionModel.define({
  label: tExpr('Edit'),
});
