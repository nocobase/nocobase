/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { List as AntdList, Col, PaginationProps } from 'antd';
import React, { useCallback, useState } from 'react';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { SortableItem } from '../../common';
import { SchemaComponentOptions } from '../../core';
import { useDesigner, useProps } from '../../hooks';
import { GridCardBlockProvider, useGridCardBlockContext, useGridCardItemProps } from './GridCard.Decorator';
import { GridCardDesigner } from './GridCard.Designer';
import { GridCardItem } from './GridCard.Item';
import { useGridCardActionBarProps, useGridCardBodyHeight } from './hooks';
import { defaultColumnCount, pageSizeOptions } from './options';

const rowGutter = {
  md: 12,
  sm: 5,
  xs: 5,
};

const designerCss = css`
  width: 100%;
  &:hover {
    > .general-schema-designer {
      display: block;
    }
  }

  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: var(--colorBgSettingsHover);
    border: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: var(--colorSettings);
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
        align-self: stretch;
      }
    }
  }
`;

export interface GridCardProps {
  columnCount?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  pagination?: PaginationProps;
}

const usePaginationProps = () => {
  const field = useField<ArrayField>();
  const { service, columnCount: _columnCount = defaultColumnCount } = useGridCardBlockContext();
  const meta = service?.data?.meta;
  const { count, pageSize, page, hasNext } = meta || {};
  if (count) {
    return {
      total: count || 0,
      pageSize: pageSize || 10,
      current: page || 1,
      pageSizeOptions,
      showSizeChanger: true,
    };
  } else {
    return {
      showTotal: false,
      pageSizeOptions,
      simple: { readOnly: true },
      pageSize: pageSize || 10,
      showTitle: false,
      showSizeChanger: true,
      hideOnSinglePage: false,
      total: field.value?.length < pageSize || !hasNext ? pageSize * page : pageSize * page + 1,
      className: css`
        .ant-pagination-simple-pager {
          display: none !important;
        }
        li {
          line-height: 32px !important;
        }
      `,
    };
  }
};

const InternalGridCard = (props: GridCardProps) => {
  // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
  const { columnCount: columnCountProp, pagination } = useProps(props);
  const { service, columnCount: _columnCount = defaultColumnCount } = useGridCardBlockContext();
  const columnCount = columnCountProp || _columnCount;
  const { run, params } = service;
  const meta = service?.data?.meta;
  const fieldSchema = useFieldSchema();
  const field = useField<ArrayField>();
  const Designer = useDesigner();
  const height = useGridCardBodyHeight();
  const [schemaMap] = useState(new Map());
  const getSchema = useCallback(
    (key) => {
      if (!schemaMap.has(key)) {
        schemaMap.set(
          key,
          new Schema({
            type: 'object',
            properties: {
              [key]: {
                ...fieldSchema.properties['item'],
              },
            },
          }),
        );
      }
      return schemaMap.get(key);
    },
    [fieldSchema.properties, schemaMap],
  );

  const onPaginationChange: PaginationProps['onChange'] = useCallback(
    (page, pageSize) => {
      run({
        ...params?.[0],
        page: page,
        pageSize: pageSize,
      });
    },
    [run, params],
  );
  const gridCardProps = {
    ...usePaginationProps(),
    ...pagination,
    onChange: onPaginationChange,
  };
  return (
    <SchemaComponentOptions
      scope={{
        useGridCardItemProps,
        useGridCardActionBarProps,
      }}
    >
      <SortableItem
        className={cx(
          'nb-card-list',
          designerCss,
          css`
            .ant-spin-nested-loading {
              height: ${height ? height + `px` : '100%'};
              overflow-y: ${height ? 'auto' : null};
              overflow-x: clip;
              .nb-action-bar {
                margin-top: 0px !important;
              }
            }
          `,
        )}
      >
        <AntdList
          pagination={
            !meta || meta.count <= meta.pageSize
              ? false
              : {
                  ...gridCardProps,
                }
          }
          dataSource={field.value}
          grid={{
            ...columnCount,
            sm: columnCount.xs,
            xl: columnCount.lg,
            gutter: [rowGutter, rowGutter],
          }}
          renderItem={(item, index) => {
            return (
              <Col style={{ height: '100%' }}>
                <RecursionField
                  key={index}
                  basePath={field.address}
                  name={index}
                  onlyRenderProperties
                  schema={getSchema(index)}
                ></RecursionField>
              </Col>
            );
          }}
          loading={service?.loading}
        />
        <Designer />
      </SortableItem>
    </SchemaComponentOptions>
  );
};

export const GridCard = withDynamicSchemaProps(InternalGridCard) as typeof InternalGridCard & {
  Item: typeof GridCardItem;
  Designer: typeof GridCardDesigner;
  Decorator: typeof GridCardBlockProvider;
};

GridCard.Item = GridCardItem;
GridCard.Designer = GridCardDesigner;
GridCard.Decorator = GridCardBlockProvider;
