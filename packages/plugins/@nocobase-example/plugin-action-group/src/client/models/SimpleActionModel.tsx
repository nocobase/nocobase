/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionModel,
  CollectionActionGroupModel,
  FilterFormActionGroupModel,
  FormActionGroupModel,
  RecordActionGroupModel,
} from '@nocobase/client';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    children: tExpr('Simple action'),
  };
}

SimpleActionModel.define({
  label: tExpr('Simple action'),
});

CollectionActionGroupModel.registerActionModels({
  SimpleActionModel,
});

RecordActionGroupModel.registerActionModels({
  SimpleActionModel,
});

FormActionGroupModel.registerActionModels({
  SimpleActionModel,
});

FilterFormActionGroupModel.registerActionModels({
  SimpleActionModel,
});
