/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd';
import { GlobalActionModel } from '../base/ActionModel';
import { openLinkAction } from '../../actions/openLinkAction';

export class LinkGlobalActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    title: 'Link',
  };
}

LinkGlobalActionModel.define({
  title: 'Link',
});

LinkGlobalActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    navigate: openLinkAction,
  },
});
