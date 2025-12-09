/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { RecordActionGroupModel, PopupActionModel } from '../base';

export class AddChildActionModel extends PopupActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: escapeT('Add child'),
  };

  getAclActionName() {
    return 'create';
  }
}

AddChildActionModel.registerFlow({
  key: 'addChildSettingsInit',
  steps: {
    addChildInit: {
      async handler(ctx, params) {
        ctx.model.onClick = (e) => {
          ctx.model.dispatchEvent('click', {
            event: e,
            parentRecord: ctx.record,
            ...ctx.inputArgs,
          });
        };
      },
    },
  },
});

AddChildActionModel.define({
  label: escapeT('Add child'),
  hide(ctx) {
    return ctx.collection?.template !== 'tree' || ctx.blockModel.props.treeTable === false;
  },
});

RecordActionGroupModel.registerActionModels({
  AddChildActionModel,
});
