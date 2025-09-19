/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { SettingOutlined } from '@ant-design/icons';
import { DragEndEvent } from '@dnd-kit/core';
import { AddSubModelButton, DndProvider, FlowSettingsButton, escapeT, useFlowEngine } from '@nocobase/flow-engine';
import React from 'react';
import { EditFormModel, FormItemModel } from '../../../blocks/form';
import { AssociationFieldModel } from '../AssociationFieldModel';
import { SubTableColumnModel } from './SubTableColumnModel';
import { SubTableField } from './SubTableField';

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
          currentBlockModel.addAppends(`${model.context.fieldPath}.${column.context.fieldPath}`, true);
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

export class SubTableFieldModel extends AssociationFieldModel {
  updateAssociation = true;
  get collection() {
    return this.context.collection;
  }

  getColumns() {
    const { enableIndexColumn } = this.props;
    const isConfigMode = !!this.flowEngine?.flowSettings?.enabled;

    const baseColumns = this.mapSubModels('columns', (column: SubTableColumnModel) => column.getColumnProps()).filter(
      Boolean,
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
      isConfigMode && {
        key: 'addColumn',
        fixed: 'right',
        width: 100,
        title: <AddFieldColumn model={this} />,
      },
    ].filter(Boolean) as any;
  }

  render() {
    const columns = this.getColumns();
    const components = {
      header: {
        wrapper: HeaderWrapperComponent,
      },
    };

    return <SubTableField {...this.props} columns={columns} components={components} />;
  }
  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('resourceName', {
      get: () => this.context.collectionField.target,
      cache: false,
    });
    this.context.defineProperty('collection', {
      get: () => this.context.collectionField.targetCollection,
    });
  }
}

SubTableFieldModel.registerFlow({
  key: 'loadTableColumns',
  title: escapeT('Association table settings'),
  sort: 300,
  steps: {
    aclCheck: {
      use: 'aclCheck',
    },
    init: {
      async handler(ctx, params) {
        await ctx.model.applySubModelsAutoFlows('columns');
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

SubTableFieldModel.define({
  label: escapeT('Sub-table'),
});
export { SubTableColumnModel };

FormItemModel.bindModelToInterface('SubTableFieldModel', ['m2m', 'o2m', 'mbm'], {
  when: (ctx, field) => {
    if (field.targetCollection) {
      return field.targetCollection.template !== 'file';
    }
    return true;
  },
});
