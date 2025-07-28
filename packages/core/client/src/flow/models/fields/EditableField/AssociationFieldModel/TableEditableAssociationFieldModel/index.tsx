/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { connect, mapReadPretty } from '@formily/react';
import React from 'react';
import { escapeT, SingleRecordResource } from '@nocobase/flow-engine';
import { EditableAssociationFieldModel } from '../EditableAssociationFieldModel';
import { SubTable } from './SubTable';
import { SubTableColumnModel } from './SubTableColumnModel';
const AssociationTable = connect(
  (props: any) => {
    return <SubTable {...props} />;
  },
  mapReadPretty((props) => {
    return <SubTable {...props} />;
  }),
);

export class TableEditableAssociationFieldModel extends EditableAssociationFieldModel {
  static supportedFieldInterfaces = ['m2m', 'o2m', 'mbm'];
  get collection() {
    return this.collectionField.targetCollection;
  }
  get component() {
    return [AssociationTable, {}];
  }
}

TableEditableAssociationFieldModel.registerFlow({
  key: 'loadTableColumns',
  title: escapeT('Association table settings'),
  sort: 300,
  steps: {
    init: {
      async handler(ctx, params) {
        await ctx.model.applySubModelsAutoFlows('columns');
        const currentBlock = ctx.model.context.blockModel;
        const resource = currentBlock.context.resource as SingleRecordResource;
        resource.addUpdateAssociationValues(ctx.model.fieldPath);
      },
    },
    allowAddNew: {
      title: escapeT('Allow add new data'),
      uiSchema: {
        allowAddNew: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: escapeT('Yes'),
            unCheckedChildren: escapeT('No'),
          },
        },
      },
      defaultParams: {
        allowAddNew: true,
      },
      handler(ctx, params) {
        ctx.model.setComponentProps({
          allowAddNew: params.allowAddNew,
        });
      },
    },
    enableIndexColumn: {
      title: escapeT('Enable index column'),
      uiSchema: {
        enableIndexColumn: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: escapeT('Yes'),
            unCheckedChildren: escapeT('No'),
          },
        },
      },
      defaultParams: {
        enableIndexColumn: true,
      },
      handler(ctx, params) {
        ctx.model.setComponentProps({
          enableIndexColumn: params.enableIndexColumn,
        });
      },
    },
  },
});

export { SubTableColumnModel };
