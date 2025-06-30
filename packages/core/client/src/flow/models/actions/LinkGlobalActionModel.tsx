/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd';
import { tval } from '@nocobase/utils/client';
import { GlobalActionModel } from '../base/ActionModel';
import { openLinkAction } from '../../actions/openLinkAction';

export class LinkGlobalActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    title: tval('Link'),
  };
}

LinkGlobalActionModel.define({
  title: tval('Link'),
});

LinkGlobalActionModel.registerFlow({
  key: 'handleClick',
  title: tval('Click event'),
  on: {
    eventName: 'click',
  },
  steps: {
    navigate: openLinkAction,
  },
});
