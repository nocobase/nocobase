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
  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('association', {
      get: () => {
        return this.context.blockModel.dataSource.getAssociation(`${this.context.blockModel.collection.name}.children`);
      },
    });
  }
}

AddChildActionModel.registerFlow({
  key: 'addChildSettingsInit',
  steps: {
    addChildInit: {
      async handler(ctx, params) {
        ctx.model.onClick = (e) => {
          ctx.resource.setSourceId(ctx.record.id);

          ctx.model.dispatchEvent('click', {
            event: e,
            ...ctx.inputArgs,
            filterByTk: null,
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
