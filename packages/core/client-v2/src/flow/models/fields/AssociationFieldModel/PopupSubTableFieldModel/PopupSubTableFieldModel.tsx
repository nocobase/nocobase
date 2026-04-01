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
import { uid } from '@formily/shared';
import classNames from 'classnames';
import { DragEndEvent } from '@dnd-kit/core';
import { css } from '@emotion/css';
import { observer } from '@formily/reactive-react';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RecordPickerContent } from '../RecordPickerFieldModel';
import { AssociationFieldModel } from '../AssociationFieldModel';
import { adjustColumnOrder } from '../../../blocks/table/utils';
import { EditFormContent } from './actions/PopupSubTableEditActionModel';
import { QuickEditFormModel } from '../../../blocks/form/QuickEditFormModel';
import { ActionWithoutPermission } from '../../../base/ActionModel';

function getRowKey(row, filterTargetKey) {
  if (!filterTargetKey) return null;

  // 多 key（联合唯一）
  if (Array.isArray(filterTargetKey)) {
    const values = filterTargetKey.map((k) => row?.[k]);
    // 只要有一个不存在，就认为是“新增记录”
    if (values.some((v) => v == null)) return null;
    return values.join('__');
  }

  // 单 key
  const value = row?.[filterTargetKey];
  return value == null ? null : String(value);
}

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
  const {
    className,
    title,
    editable,
    width,
    record,
    recordIndex,
    dataIndex,
    children,
    model: columnModel,
    ...restProps
  } = props;
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
                fieldProps: { ...columnModel.props, ...columnModel.subModels.field.props },
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
      subModelKey={'subTableColumns'}
      subModelBaseClasses={['TableColumnModel', 'TableAssociationFieldGroupModel', 'TableCustomColumnModel']}
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
    allowAddNew,
    allowSelectExistingRecord,
    disabled,
    onAddRecordClick,
    onSelectExitRecordClick,
    resetPage,
    allowCreate,
  } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const { t } = useTranslation();
  const isConfigMode = !!model.flowEngine?.flowSettings?.enabled;
  // 表格内部数据
  const [tableData, setTableData] = useState(value);

  useEffect(() => {
    setTableData(value);
  }, [value]);

  useEffect(() => {
    setCurrentPageSize(pageSize);
  }, [pageSize]);

  useEffect(() => {
    resetPage && setCurrentPage(1);
  }, [resetPage]);

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
  }, [baseColumns, enableIndexColumn, currentPage, currentPageSize, isConfigMode, model]);
  return (
    <Table
      tableLayout="fixed"
      size={size}
      rowKey={collection.filterTargetKey}
      scroll={{ x: 'max-content' }}
      dataSource={tableData}
      columns={columns}
      pagination={pagination}
      locale={{
        emptyText: (
          <span>
            {disabled
              ? t('No data')
              : allowAddNew && allowSelectExistingRecord
                ? t('Please add or select record')
                : allowAddNew
                  ? t('Please add record')
                  : allowSelectExistingRecord
                    ? t('Please select record')
                    : t('No data')}
          </span>
        ),
      }}
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
            {allowAddNew &&
              (allowCreate || isConfigMode) &&
              (allowCreate ? (
                <Button
                  type="link"
                  onClick={() => onAddRecordClick(setCurrentPage, currentPageSize)}
                  disabled={disabled}
                >
                  <PlusOutlined />
                  {t('Add new')}
                </Button>
              ) : (
                <ActionWithoutPermission message={t('No permission to add new')} forbidden={{ actionName: 'create' }}>
                  <Button type="link" disabled>
                    <PlusOutlined />
                    {t('Add new')}
                  </Button>
                </ActionWithoutPermission>
              ))}
            {allowSelectExistingRecord && (
              <Button
                type="link"
                disabled={disabled}
                onClick={() => onSelectExitRecordClick(setCurrentPage, currentPageSize)}
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
export class PopupSubTableFieldModel extends AssociationFieldModel {
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

    this.context.defineProperty('disableFieldClickToOpen', {
      value: true,
    });

    if (this.parent.context.actionName) {
      this.context.defineProperty('actionName', {
        get: () => 'view',
      });
    }
  }

  async onDispatchEventStart(eventName: string) {
    if (eventName === 'beforeRender') {
      this.context.defineProperty('associationModel', {
        value: this,
      });
      this.onAddRecordClick = (setCurrentPage, currentPageSize) => {
        this.setCurrentPage = setCurrentPage;
        this.currentPageSize = currentPageSize;
        this.dispatchEvent('openAddRecordView', {
          setCurrentPage,
          currentPageSize,
        });
      };
      this.onSelectExitRecordClick = (setCurrentPage, currentPageSize) => {
        this.setCurrentPage = setCurrentPage;
        this.currentPageSize = currentPageSize;
        this.dispatchEvent('openSelectRecordView', {
          setCurrentPage,
          currentPageSize,
        });
      };
      // 监听表单reset
      this.context.blockModel.emitter.on('onFieldReset', () => {
        this.props?.onChange([]);
      });
    }
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

  getBaseColumns(model) {
    const baseColumns = model
      .mapSubModels('subTableColumns', (column: any) => column.getColumnProps(model))
      .filter((v) => {
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
      <DisplayTable {...this.props} collection={this.collection} baseColumns={this.getBaseColumns(this)} model={this} />
    );
  }
}

PopupSubTableFieldModel.registerFlow({
  key: 'advanceSubTableAssociation',
  title: tExpr('Association table settings'),
  steps: {
    init: {
      async handler(ctx) {
        await ctx.model.applySubModelsBeforeRenderFlows('subTableColumns');
      },
    },
    quickEdit: {
      title: tExpr('Enable quick edit'),
      uiMode: { type: 'switch', key: 'editable' },
      defaultParams: {
        editable: false,
      },
      handler(ctx, params) {
        ctx.model.setProps('editable', params.editable);
      },
      async afterParamsSave(ctx, params, previousParams) {
        if (params?.editable === previousParams?.editable) return;

        const blockModel = ctx.model;
        blockModel.mapSubModels('subTableColumns', (column: any) => {
          const flow = column?.getFlow?.('tableColumnSettings');
          if (!flow?.getStep?.('quickEdit')) return;

          const quickEditParams = column.getStepParams?.('tableColumnSettings', 'quickEdit');
          if (quickEditParams && Object.prototype.hasOwnProperty.call(quickEditParams, 'editable')) {
            return;
          }

          const isReadonly = !!column?.collectionField?.readonly;
          const hasAssociationPath = !!column?.associationPathName;
          column.setProps('editable', isReadonly || hasAssociationPath ? false : !!params.editable);
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

// 添加新纪录
PopupSubTableFieldModel.registerFlow({
  key: 'popupSettings',
  title: tExpr('Edit setting'),
  on: {
    eventName: 'openAddRecordView',
  },
  sort: 300,
  steps: {
    openView: {
      title: tExpr('Edit popup (Add new)'),
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
        const parentItem = ctx?.item ?? {
          value: (typeof ctx?.getFormValues === 'function' ? ctx.getFormValues() : ctx.formValues) ?? ctx.record,
        };
        const parentItemOptions = ctx?.getPropertyOptions?.('item');
        const itemIndex = Array.isArray(ctx.model?.props?.value) ? ctx.model.props.value.length : 0;
        const itemLength = itemIndex + 1;
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'subForm',
            dataSourceKey: ctx.collection.dataSourceKey,
            collectionName: ctx.collectionField?.target,
            collectionField: ctx.collectionField,
            parentItem,
            parentItemMeta: parentItemOptions?.meta,
            parentItemResolver: parentItemOptions?.resolveOnServer,
            itemIndex,
            itemLength,
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
PopupSubTableFieldModel.registerFlow({
  key: 'selectExitRecordSettings',
  title: tExpr('Selector setting'),
  sort: 400,
  on: {
    eventName: 'openSelectRecordView',
  },
  steps: {
    openView: {
      title: tExpr('Edit popup (Select record)'),
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
                const keyField = ctx.collection.filterTargetKey;
                const merged = [
                  ...prev,
                  ...selectedRows.map((v) => {
                    return {
                      ...v,
                      __is_stored__: true,
                    };
                  }),
                ];
                const map = new Map();
                const result = [];

                for (const row of merged) {
                  const rowKey = getRowKey(row, keyField);
                  if (rowKey == null) {
                    result.push(row);
                    continue;
                  }
                  if (!map.has(rowKey)) {
                    map.set(rowKey, row);
                    result.push(row);
                  }
                }
                ctx.model.selectedRows.value = result;
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

PopupSubTableFieldModel.registerFlow({
  key: 'AdvancedSubTableUpdateRowSettings',
  on: 'updateRow',
  steps: {
    updateRow: {
      async handler(ctx, params) {
        const updatedRecord = ctx.inputArgs.updatedRecord;
        const prev = ctx.model.props?.value || [];
        const rowKey = ctx.collection.filterTargetKey;
        const pk = updatedRecord[rowKey];

        let index = -1;
        if (updatedRecord.__is_new__) {
          index = prev.findIndex((item) => item.__index__ === updatedRecord.__index__);
        } else if (pk) {
          index = prev.findIndex((item) => item[rowKey] === pk);
        }

        let next;
        if (index === -1) {
          next = [...prev, { ...updatedRecord, __is_new__: true, __index__: uid() }];
        } else {
          next = [...prev];
          next[index] = {
            ...prev[index],
            ...updatedRecord,
          };
        }

        ctx.model.props.onChange(next);
        const lastPage = Math.ceil(next.length / ctx.model.currentPageSize);
        ctx.model.setCurrentPage(lastPage);
      },
    },
  },
});

PopupSubTableFieldModel.registerFlow({
  key: 'AdvancedSubTableRemoveRowSettings',
  on: 'removeRow',
  steps: {
    removeRow: {
      async handler(ctx, params) {
        const recordOrPk = ctx.inputArgs.removeRecord;
        const rowKey = ctx.collection.filterTargetKey;
        const prev = ctx.model.props?.value || [];
        const pk = typeof recordOrPk === 'object' ? recordOrPk[rowKey] : recordOrPk;
        let index = -1;
        if (recordOrPk.__is_new__) {
          index = prev.findIndex((item) => item.__index__ === recordOrPk.__index__);
        } else {
          index = prev.findIndex((item) => item[rowKey] === pk);
        }
        if (index === -1) return prev;

        // 只删除一行，其它行引用不变
        const next = prev.slice();
        next.splice(index, 1);
        ctx.model.props.onChange(next);
      },
    },
  },
});

// 分页切换后重置page
PopupSubTableFieldModel.registerFlow({
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

PopupSubTableFieldModel.define({
  label: tExpr('Subtable (Popup editing)'),
  createModelOptions: {
    use: 'PopupSubTableFieldModel',
    subModels: {
      subTableColumns: [
        {
          use: 'PopupSubTableActionsColumnModel',
          subModels: {
            actions: [
              {
                use: 'PopupSubTableEditActionModel',
              },
              {
                use: 'PopupSubTableRemoveActionModel',
              },
            ],
          },
        },
      ],
    },
  },
});

EditableItemModel.bindModelToInterface('PopupSubTableFieldModel', ['m2m', 'o2m', 'mbm'], {
  order: 300,
  when: (ctx, field) => {
    if (field.targetCollection) {
      return field.targetCollection.template !== 'file';
    }
    return true;
  },
});
