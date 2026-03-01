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
  tExpr,
  observable,
  useFlowEngine,
} from '@nocobase/flow-engine';
import React from 'react';
import { uid } from '@formily/shared';
import { FormItemModel } from '../../../blocks/form';
import { AssociationFieldModel } from '../AssociationFieldModel';
import { RecordPickerContent } from '../RecordPickerFieldModel';
import { SubTableColumnModel } from './SubTableColumnModel';
import { SubTableField } from './SubTableField';
import { adjustColumnOrder } from '../../../blocks/table/utils';

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
  setCurrentPage;
  currentPageSize;
  get collection() {
    return this.context.collection;
  }

  getColumns() {
    const { enableIndexColumn } = this.props;

    const baseColumns = this.mapSubModels('columns', (column: SubTableColumnModel) => column.getColumnProps()).filter(
      Boolean,
    );

    return adjustColumnOrder(
      [
        enableIndexColumn && {
          key: '__index__',
          width: 48,
          align: 'center',
          fixed: 'left',
          render: (props) => {
            return props.rowIdx + 1;
          },
        },
        ...baseColumns.concat({
          key: '_empty',
        }),
        this.context.flowSettingsEnabled && {
          key: 'addColumn',
          fixed: 'right',
          width: 100,
          title: <AddFieldColumn model={this} />,
        },
      ].filter(Boolean),
    ) as any;
  }

  render() {
    const columns = this.getColumns();
    const components = {
      header: {
        wrapper: HeaderWrapperComponent,
      },
    };
    const isConfigMode = !!this.context.flowSettingsEnabled;
    return (
      <SubTableField
        {...this.props}
        columns={columns}
        components={components}
        isConfigMode={isConfigMode}
        parentFieldIndex={this.context.fieldIndex}
        parentItem={this.context.item}
        filterTargetKey={this.collection.filterTargetKey}
      />
    );
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
    this.onSelectExitRecordClick = (setCurrentPage, currentPageSize) => {
      this.setCurrentPage = setCurrentPage;
      this.currentPageSize = currentPageSize;
      this.dispatchEvent('openView', {
        setCurrentPage,
        currentPageSize,
      });
    };
  }

  set onSelectExitRecordClick(fn) {
    this.setProps({ onSelectExitRecordClick: fn });
  }
  change() {
    const lastPage = Math.ceil(this.selectedRows.value.length / this.currentPageSize);
    this.setCurrentPage(lastPage);
    this.props.onChange(this.selectedRows.value);
  }
}

SubTableFieldModel.registerFlow({
  key: 'subTableColumnSettings',
  title: tExpr('Sub-table settings'),
  sort: 300,
  steps: {
    init: {
      async handler(ctx, params) {
        await ctx.model.applySubModelsBeforeRenderFlows('columns');
      },
    },
    enableIndexColumn: {
      title: tExpr('Show row numbers'),
      uiMode: { type: 'switch', key: 'enableIndexColumn' },
      defaultParams: {
        enableIndexColumn: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          enableIndexColumn: params.enableIndexColumn,
        });
      },
    },
    pageSize: {
      title: tExpr('Page size'),
      uiMode: {
        type: 'select',
        key: 'pageSize',
        props: {
          options: [
            { label: '5', value: 5 },
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '50', value: 50 },
            { label: '100', value: 100 },
            { label: '200', value: 200 },
          ],
        },
      },
      defaultParams: {
        pageSize: 10,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          pageSize: params.pageSize,
        });
      },
    },
    allowAddNew: {
      title: tExpr('Enable add new action'),
      uiMode: { type: 'switch', key: 'allowAddNew' },
      defaultParams: {
        allowAddNew: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowAddNew: params.allowAddNew,
        });
      },
    },

    allowDisassociation: {
      title: tExpr('Enable remove action'),
      uiMode: { type: 'switch', key: 'allowDisassociation' },
      defaultParams: {
        allowDisassociation: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowDisassociation: params.allowDisassociation,
        });
      },
    },
    allowSelectExistingRecord: {
      title: tExpr('Enable select action'),
      uiMode: { type: 'switch', key: 'allowSelectExistingRecord' },
      defaultParams: {
        allowSelectExistingRecord: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowSelectExistingRecord: params.allowSelectExistingRecord,
        });
      },
    },
  },
});

SubTableFieldModel.registerFlow({
  key: 'selectExitRecordSettings',
  title: tExpr('Selector setting'),
  sort: 400,
  on: {
    eventName: 'openView',
  },
  steps: {
    openView: {
      title: tExpr('Edit popup (Select record)'),
      hideInSettings(ctx) {
        const allowSelectExistingRecord = ctx.model.getStepParams?.(
          'subTableColumnSettings',
          'allowSelectExistingRecord',
        )?.allowSelectExistingRecord;
        return !allowSelectExistingRecord;
      },
      uiSchema(ctx) {
        return {
          mode: {
            type: 'string',
            title: tExpr('Open mode'),
            enum: [
              { label: tExpr('Drawer'), value: 'drawer' },
              { label: tExpr('Dialog'), value: 'dialog' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
          size: {
            type: 'string',
            title: tExpr('Popup size'),
            enum: [
              { label: tExpr('Small'), value: 'small' },
              { label: tExpr('Medium'), value: 'medium' },
              { label: tExpr('Large'), value: 'large' },
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
        const openMode = ctx.isMobileLayout ? 'embed' : ctx.inputArgs.mode || params.mode || 'drawer';
        const size = ctx.inputArgs.size || params.size || 'medium';
        ctx.model.selectedRows.value = ctx.model.props.value || [];
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
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
                const merged = [
                  ...prev,
                  ...selectedRows.map((v) => {
                    return {
                      ...v,
                      __is_stored__: true,
                    };
                  }),
                ];

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

// 分页切换后重置page
SubTableFieldModel.registerFlow({
  key: 'paginationChange',
  on: 'paginationChange',
  steps: {
    pageRefresh: {
      handler(ctx, params) {
        ctx.model.setProps({
          resetPage: uid(),
        });
      },
    },
  },
});

SubTableFieldModel.define({
  label: tExpr('Subtable (Inline editing)'),
});
export { SubTableColumnModel };

FormItemModel.bindModelToInterface('SubTableFieldModel', ['m2m', 'o2m', 'mbm'], {
  order: 200,
  when: (ctx, field) => {
    if (field.targetCollection) {
      return field.targetCollection.template !== 'file';
    }
    return true;
  },
});
