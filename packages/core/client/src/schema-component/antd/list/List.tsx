import { ListDesigner } from './List.Designer';
import { ListBlockProvider, useListBlockContext, useListItemProps } from './List.Decorator';
import React, { useCallback, useEffect, useState } from 'react';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { css, cx } from '@emotion/css';
import { List as AntdList, PaginationProps } from 'antd';
import { useListActionBarProps } from './hooks';
import { SortableItem } from '../../common';
import { SchemaComponentOptions } from '../../core';
import { useDesigner } from '../../hooks';
import { ListItem } from './List.Item';
import { ArrayField } from '@formily/core';

const designerCss = css`
  width: 100%;
  margin-bottom: var(--nb-spacing);
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

const InternalList = (props) => {
  const { service } = useListBlockContext();
  const { run, params } = service;
  const fieldSchema = useFieldSchema();
  const Designer = useDesigner();
  const meta = service?.data?.meta;
  const field = useField<ArrayField>();
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
        useListItemProps,
        useListActionBarProps,
      }}
    >
      <SortableItem className={cx('nb-list', designerCss)}>
        <AntdList
          pagination={
            !meta || meta.count <= meta.pageSize
              ? false
              : {
                  onChange: onPaginationChange,
                  total: meta?.count || 0,
                  pageSize: meta?.pageSize || 10,
                  current: meta?.page || 1,
                }
          }
          loading={service?.loading}
        >
          {field.value?.map((item, index) => {
            return (
              <RecursionField
                basePath={field.address}
                key={index}
                name={index}
                onlyRenderProperties
                schema={getSchema(index)}
              ></RecursionField>
            );
          })}
        </AntdList>
        <Designer />
      </SortableItem>
    </SchemaComponentOptions>
  );
};

export const List = InternalList as typeof InternalList & {
  Item: typeof ListItem;
  Designer: typeof ListDesigner;
  Decorator: typeof ListBlockProvider;
};

List.Item = ListItem;
List.Designer = ListDesigner;
List.Decorator = ListBlockProvider;
