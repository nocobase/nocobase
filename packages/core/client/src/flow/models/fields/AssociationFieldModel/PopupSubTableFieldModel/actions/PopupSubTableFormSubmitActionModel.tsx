/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { ActionGroupModel, ActionModel } from '../../../../base';
import { omitHiddenModelValuesFromSubmit } from '../../../../blocks/form/submitValues';

function matchPath(paths: string[], key: string) {
  return paths.find((p) => p === key || p.endsWith(`.${key}`)) ?? key;
}
export class PopupSubTableFormSubmitActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    title: tExpr('Submit'),
    type: 'primary',
    htmlType: 'submit',
  };
}

PopupSubTableFormSubmitActionModel.define({
  label: tExpr('Submit'),
});

PopupSubTableFormSubmitActionModel.registerFlow({
  key: 'submitSettings',
  on: 'click',
  title: tExpr('Submit action settings'),
  steps: {
    confirm: {
      use: 'confirm',
      defaultParams: {
        enable: false,
        title: tExpr('Submit record'),
        content: tExpr('Are you sure you want to save it?'),
      },
      async handler(ctx, params) {
        if (params.enable) {
          try {
            await ctx.form.validateFields();
            const confirmed = await ctx.modal.confirm({
              title: ctx.t(params.title, { ns: 'lm-flow-engine' }),
              content: ctx.t(params.content, { ns: 'lm-flow-engine' }),
              okText: ctx.t('Confirm'),
              cancelText: ctx.t('Cancel'),
            });

            if (!confirmed) {
              ctx.exit();
            }
          } catch (error) {
            ctx.exit();
          }
        }
      },
    },
    save: {
      async handler(ctx, params) {
        const blockModel = ctx.blockModel;
        const subTableModel = blockModel.context.associationModel;
        const parentResource = subTableModel.context.resource;
        const currentResource = blockModel.resource;
        const updateAssociations = currentResource.getUpdateAssociationValues();
        const associationName = subTableModel.context.collectionField.name;
        const parentUpdateAssociations = parentResource.getUpdateAssociationValues();
        const prefixPath = matchPath(parentUpdateAssociations, associationName);
        try {
          await blockModel.form.validateFields();
          const rawValues = blockModel.form.getFieldsValue(true);
          const values = omitHiddenModelValuesFromSubmit(rawValues, blockModel);
          subTableModel.dispatchEvent('updateRow', {
            updatedRecord: values,
          });
          const newUpdateAssociations = updateAssociations.map((v) => {
            return `${prefixPath}.${v}`;
          });
          parentResource.addUpdateAssociationValues(newUpdateAssociations);
        } catch (error) {
          return;
        }
        if (ctx.view) {
          ctx.view.close();
        }
      },
    },
  },
});

export class PopupSubTableFormActionGroupModel extends ActionGroupModel {
  static baseClass = PopupSubTableFormSubmitActionModel;
}
