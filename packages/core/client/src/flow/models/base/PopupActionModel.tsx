/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { openViewFlow } from '../../flows/openViewFlow';
import { ActionModel } from './ActionModel';

export class PopupActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Popup'),
  };
}

PopupActionModel.define({
  label: escapeT('Popup'),
});

PopupActionModel.registerFlow(openViewFlow);
