import React, { useCallback, useState } from 'react';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { css, cx } from '@emotion/css';
import { List as AntdList, PaginationProps, Col } from 'antd';
import { useGridCardActionBarProps } from './hooks';
import { SortableItem } from '../../common';
import { SchemaComponentOptions } from '../../core';
import { useDesigner } from '../../hooks';
import { GridCardItem } from './GridCard.Item';
import { useGridCardBlockContext, useGridCardItemProps, GridCardBlockProvider } from './GridCard.Decorator';
import { GridCardDesigner } from './GridCard.Designer';
import { ArrayField } from '@formily/core';
import { defaultColumnCount, pageSizeOptions } from './options';

const rowGutter = {
  md: 16,
  sm: 8,
  xs: 8,
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
    background: rgba(241, 139, 98, 0.06);
    border: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: #f18b62;
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
      }
    }
  }
`;

const InternalGridCard = (props) => {
  const { service, columnCount = defaultColumnCount } = useGridCardBlockContext();
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
              [key]: fieldSchema.properties['item'],
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

export const GridCard = InternalGridCard as typeof InternalGridCard & {
  Item: typeof GridCardItem;
  Designer: typeof GridCardDesigner;
  Decorator: typeof GridCardBlockProvider;
};

GridCard.Item = GridCardItem;
GridCard.Designer = GridCardDesigner;
GridCard.Decorator = GridCardBlockProvider;
