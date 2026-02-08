/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import {
  AddSubModelButton,
  tExpr,
  FlowSettingsButton,
  DndProvider,
  useFlowEngine,
  observer,
} from '@nocobase/flow-engine';
import { Table } from 'antd';
import classNames from 'classnames';
import { DragEndEvent } from '@dnd-kit/core';
import { css } from '@emotion/css';
import { isEmpty } from 'lodash';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldModel } from '../../base';
import { DetailsItemModel } from '../../blocks/details/DetailsItemModel';
import { adjustColumnOrder } from '../../blocks/table/utils';

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
  const { className, title, editable, width, record, recordIndex, dataIndex, children, model, ...restProps } = props;
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
      subModelBaseClasses={['TableColumnModel', 'TableAssociationFieldGroupModel']}
      keepDropdownOpen
    >
      <FlowSettingsButton icon={<SettingOutlined />}>{model.translate('Fields')}</FlowSettingsButton>
    </AddSubModelButton>
  );
};

const DisplayTable = (props) => {
  const { pageSize, value, size, collection, baseColumns, enableIndexColumn = true, model } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const { t } = useTranslation();

  useEffect(() => {
    setCurrentPageSize(pageSize);
  }, [pageSize]);

  // 前端分页
  const pagination = useMemo(() => {
    return {
      current: currentPage, // 当前页码
      pageSize: currentPageSize, // 每页条目数
      total: value?.length, // 数据总条数
      onChange: (page, size) => {
        setCurrentPage(page); // 更新当前页码
        setCurrentPageSize(size); // 更新每页显示条目数
      },
      showSizeChanger: true, // 显示每页条数切换
      showTotal: (total) => {
        return t('Total {{count}} items', { count: total });
      },
    } as any;
  }, [currentPage, currentPageSize, value]);

  const getColumns = () => {
    const cols = adjustColumnOrder(
      [
        enableIndexColumn && {
          key: '__index__',
          width: 48,
          align: 'center',
          fixed: 'left',
          render: (props, record, index) => {
            const pageRowIdx = (currentPage - 1) * currentPageSize + index;
            return pageRowIdx + 1;
          },
        },
        ...baseColumns.concat({
          key: 'empty',
        }),
      ].filter(Boolean),
    ) as any;
    if (model.context.flowSettingsEnabled) {
      cols.push({
        key: 'addColumn',
        fixed: 'right',
        width: 100,
        title: <AddFieldColumn model={model} />,
      } as any);
    }
    return cols;
  };
  const handleChange = useCallback(
    async (pagination, filters, sorter) => {
      //支持列点击排序
      if (!isEmpty(sorter)) {
        const resource = model.context.blockModel.resource;
        const globalSort = model.props.globalSort;
        const fieldPath = model.context.collectionField.name;
        const sort = sorter.order ? (sorter.order === `ascend` ? [sorter.field] : [`-${sorter.field}`]) : globalSort;
        const sortPath = sort ? `${fieldPath}(sort=${sort})` : fieldPath;
        const appends = resource.getAppends();
        const newAppends = appends.map((item) =>
          new RegExp(`^${fieldPath}\\(sort=[^)]+\\)$`).test(item) || item === fieldPath ? sortPath : item,
        );
        if (sorter) {
          resource.setAppends(newAppends);
        }
        await resource.refresh();
      }
    },
    [model],
  );

  return (
    <Table
      tableLayout="fixed"
      size={size}
      rowKey={collection.filterTargetKey}
      scroll={{ x: 'max-content' }}
      dataSource={value}
      columns={getColumns()}
      pagination={pagination}
      onChange={handleChange}
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
      `}
      components={{
        header: {
          wrapper: HeaderWrapperComponent,
        },
        body: {
          cell: RenderCell,
        },
      }}
    />
  );
};
export class DisplaySubTableFieldModel extends FieldModel {
  disableTitleField = true;
  defaultOverflowMode = 'ellipsis';
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
    this.context.defineProperty('actionName', {
      get: () => {
        return 'view';
      },
      cache: false,
    });
  }

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    await this.dispatchEvent('beforeRender');
  }

  getBaseColumns() {
    const baseColumns = this.mapSubModels(
      'columns',
      (column: any) => column.use === 'TableColumnModel' && column.getColumnProps(),
    ).filter((v) => {
      return v && !v?.hidden;
    });

    return baseColumns;
  }

  public render() {
    return (
      <DisplayTable {...this.props} collection={this.collection} baseColumns={this.getBaseColumns()} model={this} />
    );
  }
}

DisplaySubTableFieldModel.registerFlow({
  key: 'TableAssociation',
  title: tExpr('Association table settings'),
  steps: {
    init: {
      async handler(ctx) {
        await ctx.model.applySubModelsBeforeRenderFlows('columns');
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
  },
});

DisplaySubTableFieldModel.define({
  label: tExpr('Sub-table'),
});

DetailsItemModel.bindModelToInterface('DisplaySubTableFieldModel', ['m2m', 'o2m', 'mbm']);
