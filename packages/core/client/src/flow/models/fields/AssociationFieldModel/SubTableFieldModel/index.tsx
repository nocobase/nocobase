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
import {
  AddSubModelButton,
  DndProvider,
  FlowSettingsButton,
  escapeT,
  observable,
  useFlowEngine,
} from '@nocobase/flow-engine';
import React from 'react';
import { EditFormModel, FormItemModel } from '../../../blocks/form';
import { AssociationFieldModel } from '../AssociationFieldModel';
import { RecordPickerContent } from '../RecordPickerFieldModel';
import { SubTableColumnModel } from './SubTableColumnModel';
import { SubTableField } from './SubTableField';

const AddFieldColumn = ({ model }) => {
  return (
    <AddSubModelButton
      model={model}
      subModelKey={'columns'}
      subModelBaseClasses={['SubTableColumnModel']}
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
  selectedRows = observable.ref([]);
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
    // 监听表单reset
    this.context.blockModel.emitter.on('onFieldReset', () => {
      this.props.onChange([]);
    });
    this.onSelectExitRecordClick = (e) => {
      this.dispatchEvent('openView', {
        event: e,
      });
    };
  }
  protected onMount(): void {
    console.log('子表格onMount', this.props.value);
  }
  set onSelectExitRecordClick(fn) {
    this.setProps({ onSelectExitRecordClick: fn });
  }
  change() {
    this.props.onChange(this.selectedRows.value);
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
    allowSelectExistingRecord: {
      title: escapeT('Allow selection of existing records'),
      uiSchema: {
        allowSelectExistingRecord: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: escapeT('Yes'),
            unCheckedChildren: escapeT('No'),
          },
        },
      },
      defaultParams: {
        allowSelectExistingRecord: false,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowSelectExistingRecord: params.allowSelectExistingRecord,
        });
      },
    },
    allowDisassociation: {
      title: escapeT('Allow disassociation'),
      uiSchema: {
        allowDisassociation: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: escapeT('Yes'),
            unCheckedChildren: escapeT('No'),
          },
        },
      },
      defaultParams: {
        allowDisassociation: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowDisassociation: params.allowDisassociation,
        });
      },
    },
  },
});

SubTableFieldModel.registerFlow({
  key: 'selectExitRecordSettings',
  title: escapeT('Selector setting'),
  on: {
    eventName: 'openView',
  },
  steps: {
    openView: {
      title: escapeT('Edit popup'),
      uiSchema(ctx) {
        if (!ctx.model.props.allowSelectExistingRecord) {
          return;
        }
        return {
          mode: {
            type: 'string',
            title: escapeT('Open mode'),
            enum: [
              { label: escapeT('Drawer'), value: 'drawer' },
              { label: escapeT('Dialog'), value: 'dialog' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
          size: {
            type: 'string',
            title: escapeT('Popup size'),
            enum: [
              { label: escapeT('Small'), value: 'small' },
              { label: escapeT('Medium'), value: 'medium' },
              { label: escapeT('Large'), value: 'large' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
        };
      },
      defaultParams: {
        mode: 'drawer',
        size: 'medium',
      },
      handler(ctx, params) {
        const sizeToWidthMap: Record<string, any> = {
          drawer: {
            small: '30%',
            medium: '50%',
            large: '70%',
          },
          dialog: {
            small: '40%',
            medium: '50%',
            large: '80%',
          },
          embed: {},
        };
        const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
        const size = ctx.inputArgs.size || params.size || 'medium';
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'select',
            dataSourceKey: ctx.collection.dataSourceKey,
            collectionName: ctx.collectionField?.target,
            collectionField: ctx.collectionField,
            rowSelectionProps: {
              type: 'checkbox',
              defaultSelectedRows: () => {
                return ctx.model.props.value;
              },
              renderCell: undefined,
              selectedRowKeys: undefined,
              onChange: (_, selectedRows) => {
                const prev = ctx.model.props.value || [];
                const merged = [...prev, ...selectedRows];

                // 去重，防止同一个值重复
                const unique = merged.filter(
                  (row, index, self) =>
                    index ===
                    self.findIndex((r) => r[ctx.collection.filterTargetKey] === row[ctx.collection.filterTargetKey]),
                );

                ctx.model.selectedRows.value = unique;
              },
            },
          },
          content: () => <RecordPickerContent model={ctx.model} />,
          styles: {
            content: {
              padding: 0,
              backgroundColor: ctx.model.flowEngine.context.themeToken.colorBgLayout,
              ...(openMode === 'embed' ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}),
            },
            body: {
              padding: 0,
            },
          },
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
