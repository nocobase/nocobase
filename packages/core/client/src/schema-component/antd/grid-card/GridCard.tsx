import { css, cx } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { List as AntdList, Col, PaginationProps } from 'antd';
import React, { useCallback, useState } from 'react';
import { SortableItem } from '../../common';
import { SchemaComponentOptions } from '../../core';
import { useDesigner, useProps } from '../../hooks';
import { GridCardBlockProvider, useGridCardBlockContext, useGridCardItemProps } from './GridCard.Decorator';
import { GridCardDesigner } from './GridCard.Designer';
import { GridCardItem } from './GridCard.Item';
import { useGridCardActionBarProps } from './hooks';
import { defaultColumnCount, pageSizeOptions } from './options';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';

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

const InternalGridCard = (props) => {
  // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
  const { columnCount: columnCountProp, pagination } = useProps(props);

  const { service, columnCount: _columnCount = defaultColumnCount } = useGridCardBlockContext();
  const columnCount = columnCountProp || _columnCount;
  const { run, params } = service;
  const meta = service?.data?.meta;
  const fieldSchema = useFieldSchema();
  const field = useField<ArrayField>();
  const Designer = useDesigner();
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

  return (
    <SchemaComponentOptions
      scope={{
        useGridCardItemProps,
        useGridCardActionBarProps,
      }}
    >
      <SortableItem className={cx('nb-card-list', designerCss)}>
        <AntdList
          pagination={
            !meta || meta.count <= meta.pageSize
              ? false
              : {
                  ...pagination,
                  onChange: onPaginationChange,
                  total: meta?.count || 0,
                  pageSize: meta?.pageSize || 10,
                  current: meta?.page || 1,
                  pageSizeOptions,
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
