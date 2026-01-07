/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined, ZoomInOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import {
  AddSubModelButton,
  tExpr,
  FlowSettingsButton,
  DndProvider,
  useFlowEngine,
  EditableItemModel,
  observable,
  createCurrentRecordMetaFactory,
  useFlowModel,
} from '@nocobase/flow-engine';
import { Table, Button, Space } from 'antd';
import classNames from 'classnames';
import { DragEndEvent } from '@dnd-kit/core';
import { css } from '@emotion/css';
import { observer } from '@formily/reactive-react';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RecordPickerContent } from '../RecordPickerFieldModel';
import { AssociationFieldModel } from '../AssociationFieldModel';
import { adjustColumnOrder } from '../../../blocks/table/utils';
import { EditFormContent } from './actions/SubTableEditActionModel';
import { QuickEditFormModel } from '../../../blocks/form/QuickEditFormModel';

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

const RenderCell = observer<any>((props) => {
  const { className, title, editable, width, record, recordIndex, dataIndex, children, ...restProps } = props;
  const ref = useRef(null);
  const model: any = useFlowModel();
  if (editable) {
    return (
      <td
        ref={ref}
        {...restProps}
        className={classNames(
          className,
          css`
            .edit-icon {
              position: absolute;
              display: none;
              color: #1890ff;
              margin-left: 8px;
              cursor: pointer;
              z-index: 100;
              top: 50%;
              right: 8px;
              transform: translateY(-50%);
            }
            &:hover {
              background: rgba(24, 144, 255, 0.1) !important;
            }
            &:hover .edit-icon {
              display: inline-flex;
            }
          `,
        )}
      >
        <EditOutlined
          className="edit-icon"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 阻止事件冒泡，避免触发行选中
            try {
              await QuickEditFormModel.open({
                flowEngine: model.flowEngine,
                target: ref.current,
                dataSourceKey: model.collection.dataSourceKey,
                collectionName: model.collection.name,
                fieldPath: dataIndex,
                record: record,
                fieldProps: { ...model.props, ...model.subModels.field.props },
                onOk: (values) => {
                  record[dataIndex] = values[dataIndex];
                  // 仅重渲染单元格
                  const fork: any = model.subModels.field.createFork({}, `${recordIndex}`);
                  // Provide expandable meta for current row record based on the collection in context
                  const recordMeta = createCurrentRecordMetaFactory(
                    fork.context,
                    () => (fork.context as any).collection,
                  );
                  fork.context.defineProperty('record', {
                    get: () => record,
                    cache: false,
                    meta: recordMeta,
                  });
                  fork.setProps({ ...model.props, value: values[dataIndex] });
                  fork.context.defineProperty('recordIndex', {
                    get: () => recordIndex,
                  });

                  model.rerender();
                },
              });
            } catch (error) {
              console.log(error);
            }
          }}
        />
        <div
          ref={ref}
          className={css`
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: calc(${width}px - 16px);
          `}
        >
          {children}
        </div>
      </td>
    );
  }
  return (
    <td className={classNames(className)} {...restProps}>
      <div style={{ width }}> {children}</div>
    </td>
  );
});

const AddFieldColumn = ({ model }) => {
  return (
    <AddSubModelButton
      model={model}
      subModelKey={'columns'}
      subModelBaseClasses={['TableColumnModel', 'TableCustomColumnModel']}
      keepDropdownOpen
    >
      <FlowSettingsButton icon={<SettingOutlined />}>{model.translate('Fields')}</FlowSettingsButton>
    </AddSubModelButton>
  );
};

const DisplayTable = (props) => {
  const {
    pageSize,
    value,
    size,
    collection,
    baseColumns,
    enableIndexColumn = true,
    model,
    onChange,
    allowAddNew,
    allowSelectExistingRecord,
    disabled,
    onAddRecordClick,
    onSelectExitRecordClick,
  } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const { t } = useTranslation();
  const rowKey = collection.filterTargetKey;

  // 表格内部数据
  const [tableData, setTableData] = useState(value);

  useEffect(() => {
    setTableData(value);
  }, [value]);

  useEffect(() => {
    setCurrentPageSize(pageSize);
  }, [pageSize]);

  const updateRow = useCallback(
    (updatedRecord) => {
      setTableData((prev = []) => {
        const pk = updatedRecord[rowKey];
        const index = prev.findIndex((item) => item[rowKey] === pk);

        let next;
        if (index === -1 || !pk) {
          // 没找到：作为新记录追加到最后
          next = [...prev, { ...updatedRecord, __is_new__: true }];
          const lastPage = Math.ceil(next.length / currentPageSize);
          setCurrentPage(lastPage);
        } else {
          // 找到：更新原有记录
          next = [...prev];
          next[index] = {
            ...prev[index],
            ...updatedRecord,
          };
        }

        onChange?.(next);
        return next;
      });
    },
    [rowKey, onChange, setCurrentPage, currentPageSize],
  );

  const removeRow = useCallback(
    (recordOrPk) => {
      const pk = typeof recordOrPk === 'object' ? recordOrPk[rowKey] : recordOrPk;

      setTableData((prev) => {
        const index = prev.findIndex((item) => item[rowKey] === pk);
        if (index === -1) return prev;

        // 只删除一行，其它行引用不变
        const next = prev.slice();
        next.splice(index, 1);
        onChange(next);
        return next;
      });
    },
    [rowKey],
  );

  useEffect(() => {
    model.updateRow = updateRow;
    model.removeRow = removeRow;
    return () => {
      if (model.updateRow === updateRow) {
        delete model.updateRow;
      }
      if (model.removeRow === removeRow) {
        delete model.removeRow;
      }
    };
  }, [model, updateRow, removeRow]);

  // 前端分页
  const pagination = useMemo(() => {
    return {
      current: currentPage, // 当前页码
      pageSize: currentPageSize, // 每页条目数
      total: tableData?.length, // 数据总条数
      onChange: (page, size) => {
        setCurrentPage(page); // 更新当前页码
        setCurrentPageSize(size); // 更新每页显示条目数
      },
      showSizeChanger: true, // 显示每页条数切换
      showTotal: (total) => {
        return t('Total {{count}} items', { count: total });
      },
    } as any;
  }, [currentPage, currentPageSize, tableData]);

  const columns = useMemo(() => {
    const isConfigMode = !!model.flowEngine?.flowSettings?.enabled;

    const cols = adjustColumnOrder(
      [
        enableIndexColumn && {
          key: '__index__',
          width: 48,
          align: 'center',
          fixed: 'left',
          render: (_: any, __: any, index: number) => {
            const pageRowIdx = (currentPage - 1) * currentPageSize + index;
            return pageRowIdx + 1;
          },
        },
        ...baseColumns,
        { key: 'empty' },
      ].filter(Boolean),
    ) as any[];

    if (isConfigMode) {
      cols.push({
        key: 'addColumn',
        fixed: 'right',
        width: 100,
        title: <AddFieldColumn model={model} />,
      });
    }

    return cols;
  }, [baseColumns, enableIndexColumn, currentPage, currentPageSize, model.flowEngine?.flowSettings?.enabled, model]);
  return (
    <Table
      tableLayout="fixed"
      size={size}
      rowKey={collection.filterTargetKey}
      scroll={{ x: 'max-content' }}
      dataSource={tableData}
      columns={columns}
      pagination={pagination}
      className={css`
        .ant-table-cell-ellipsis.ant-table-cell-fix-right-first .ant-table-cell-content {
          display: inline;
        }
        .ant-table-cell-with-append div {
          display: flex;
        }
        .ant-table-column-sorters .ant-table-column-title {
          overflow: visible;
        }
        .ant-table-footer {
          padding: 0;
          button {
            margin-top: 4px !important;
            margin-bottom: 4px;
          }
        }
      `}
      components={{
        header: {
          wrapper: HeaderWrapperComponent,
        },
        body: {
          cell: RenderCell,
        },
      }}
      footer={() => (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space size={'middle'}>
            {!disabled && allowAddNew !== false && (
              <Button type="link" onClick={onAddRecordClick} style={{ marginTop: 8 }}>
                <PlusOutlined /> {t('Add new')}
              </Button>
            )}
            {!disabled && allowSelectExistingRecord && (
              <Button
                type="link"
                onClick={() => onSelectExitRecordClick(setCurrentPage, currentPageSize)}
                style={{ marginTop: 8 }}
              >
                <ZoomInOutlined /> {t('Select record')}
              </Button>
            )}
          </Space>
        </div>
      )}
    />
  );
};
export class AdvancedSubTableFieldModel extends AssociationFieldModel {
  disableTitleField = true;
  defaultOverflowMode = 'ellipsis';
  updateAssociation = true;
  selectedRows = observable.ref([]);
  setCurrentPage;
  currentPageSize;
  get collection() {
    return this.context.collection;
  }
  get collectionField() {
    return this.context.collectionField;
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
    this.context.defineProperty('prefixFieldPath', {
      get: () => {
        return this.context.fieldPath;
      },
    });
    this.context.defineProperty('associationModel', {
      value: this,
    });
    if (this.parent.context.actionName) {
      this.context.defineProperty('actionName', {
        get: () => 'view',
      });
    }

    // 监听表单reset
    this.context.blockModel.emitter.on('onFieldReset', () => {
      this.props.onChange([]);
    });
    this.onSelectExitRecordClick = (setCurrentPage, currentPageSize) => {
      this.setCurrentPage = setCurrentPage;
      this.currentPageSize = currentPageSize;
      this.dispatchEvent('openSelectRecordView', {
        setCurrentPage,
        currentPageSize,
      });
    };
    this.onAddRecordClick = () => {
      this.dispatchEvent('openAddRecordView', {});
    };
  }

  set onSelectExitRecordClick(fn) {
    this.setProps({ onSelectExitRecordClick: fn });
  }

  set onAddRecordClick(fn) {
    this.setProps({ onAddRecordClick: fn });
  }

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    await this.dispatchEvent('beforeRender');
  }

  getBaseColumns() {
    const baseColumns = this.mapSubModels('columns', (column: any) => column.getColumnProps()).filter((v) => {
      return !v?.hidden;
    });

    return baseColumns;
  }

  change() {
    const lastPage = Math.ceil(this.selectedRows.value.length / this.currentPageSize);
    this.setCurrentPage(lastPage);
    this.props.onChange(this.selectedRows.value);
  }

  public render() {
    return (
      <DisplayTable {...this.props} collection={this.collection} baseColumns={this.getBaseColumns()} model={this} />
    );
  }
}

AdvancedSubTableFieldModel.registerFlow({
  key: 'advanceSubTableAssociation',
  title: tExpr('Association table settings'),
  steps: {
    init: {
      async handler(ctx) {
        await ctx.model.applySubModelsBeforeRenderFlows('columns');
      },
    },
    // quickEdit: {
    //   title: tExpr('Enable quick edit'),
    //   uiMode: { type: 'switch', key: 'editable' },
    //   defaultParams: {
    //     editable: false,
    //   },
    //   handler(ctx, params) {
    //     ctx.model.setProps('editable', params.editable);
    //   },
    // },
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
        allowSelectExistingRecord: false,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowSelectExistingRecord: params.allowSelectExistingRecord,
        });
      },
    },
  },
});

// 添加新纪录
AdvancedSubTableFieldModel.registerFlow({
  key: 'popupSettings',
  title: tExpr('Edit setting'),
  on: {
    eventName: 'openAddRecordView',
  },
  sort: 300,
  steps: {
    openView: {
      title: tExpr('Edit add new popup'),
      hideInSettings(ctx) {
        const allowAddNew = ctx.model.getStepParams?.('advanceSubTableAssociation', 'allowAddNew')?.allowAddNew;
        return allowAddNew === false;
      },
      uiSchema: {
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
          target: ctx.layoutContentElement,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'editInFront',
            dataSourceKey: ctx.collection.dataSourceKey,
            collectionName: ctx.collectionField?.target,
            collectionField: ctx.collectionField,
          },
          content: () => <EditFormContent model={ctx.model} scene="create" />,
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

// 选择已有纪录关联
AdvancedSubTableFieldModel.registerFlow({
  key: 'selectExitRecordSettings',
  title: tExpr('Selector setting'),
  sort: 400,
  on: {
    eventName: 'openSelectRecordView',
  },
  steps: {
    openView: {
      title: tExpr('Edit select record popup'),
      hideInSettings(ctx) {
        const allowSelectExistingRecord = ctx.model.getStepParams?.(
          'advanceSubTableAssociation',
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

AdvancedSubTableFieldModel.define({
  label: tExpr('Sub-table(Advanced)'),
});

EditableItemModel.bindModelToInterface('AdvancedSubTableFieldModel', ['m2m', 'o2m', 'mbm']);
