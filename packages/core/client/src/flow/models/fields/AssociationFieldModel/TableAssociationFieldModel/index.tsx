/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DragEndEvent } from '@dnd-kit/core';
import React from 'react';
import {
  SingleRecordResource,
  escapeT,
  AddSubModelButton,
  FlowSettingsButton,
  useFlowEngine,
  DndProvider,
} from '@nocobase/flow-engine';
import { SettingOutlined } from '@ant-design/icons';
import { AssociationFieldModel } from '../AssociationFieldModel';
import { SubTableField } from './SubTableField';
import { SubTableColumnModel } from './SubTableColumnModel';
import { EditFormModel } from '../../../data-blocks/form/EditFormModel';
import { CollectionNotAllowView } from '../../../base/BlockModel';

const AddFieldColumn = ({ model }) => {
  return (
    <AddSubModelButton
      model={model}
      subModelKey={'columns'}
      subModelBaseClasses={['SubTableColumnModel']}
      afterSubModelInit={async (column: SubTableColumnModel) => {
        await column.applyAutoFlows();
      }}
      afterSubModelAdd={async (column: SubTableColumnModel) => {
        const currentBlockModel = model.context.blockModel;
        if (currentBlockModel instanceof EditFormModel) {
          currentBlockModel.addAppends(`${model.fieldPath}.${column.fieldPath}`, true);
        }
      }}
      keepDropdownOpen
    >
      <FlowSettingsButton icon={<SettingOutlined />}>{model.translate('Fields')}</FlowSettingsButton>
    </AddSubModelButton>
  );
};

const HeaderWrapperComponent = React.memo((props) => {
  const engine = useFlowEngine();

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id && over?.id && active.id !== over.id) {
      engine.moveModel(active.id as string, over.id as string);
    }
  };

  return (
    <DndProvider onDragEnd={onDragEnd}>
      <thead {...props} />
    </DndProvider>
  );
});

export class TableAssociationFieldModel extends AssociationFieldModel {
  static supportedFieldInterfaces = ['m2m', 'o2m', 'mbm'];
  get collection() {
    return this.collectionField.targetCollection;
  }
  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('resourceName', {
      get: () => this.collectionField.target,
      cache: false,
    });
  }
  getColumns() {
    const { enableIndexColumn } = this.props;
    const baseColumns = this.mapSubModels('columns', (column: SubTableColumnModel) => column.getColumnProps()).filter(
      (v) => {
        return !v.hidden;
      },
    );

    return [
      enableIndexColumn && {
        key: '__index__',
        width: 48,
        align: 'center',
        fixed: 'left',
        render: (props) => {
          return props.rowIdx + 1;
        },
      },
      ...baseColumns,
      {
        key: 'addColumn',
        fixed: 'right',
        width: 100,
        title: <AddFieldColumn model={this} />,
      },
    ].filter(Boolean) as any;
  }

  get component() {
    const columns = this.getColumns();
    return [
      SubTableField,
      {
        columns,
        components: {
          header: {
            wrapper: HeaderWrapperComponent,
          },
        },
      },
    ];
  }
}

TableAssociationFieldModel.registerFlow({
  key: 'loadTableColumns',
  title: escapeT('Association table settings'),
  sort: 300,
  steps: {
    aclCheck: {
      async handler(ctx, params) {
        {
          const result = await ctx.aclCheck({
            dataSourceKey: ctx.model.context.dataSource.key,
            resourceName: ctx.model.collectionField.target,
            actionName: ctx.model.context.actionName,
          });
          if (!result) {
            ctx.model.hidden = true;
            ctx.exitAll();
          }
        }
      },
    },
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
        ctx.model.setProps({
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
        ctx.model.setProps({
          enableIndexColumn: params.enableIndexColumn,
        });
      },
    },
  },
});

export { SubTableColumnModel };
