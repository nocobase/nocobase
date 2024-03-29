import { cx } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { List as AntdList, PaginationProps } from 'antd';
import React, { useCallback, useState } from 'react';
import { SortableItem } from '../../common';
import { SchemaComponentOptions } from '../../core';
import { useDesigner } from '../../hooks';
import { ListBlockProvider, useListBlockContext, useListItemProps } from './List.Decorator';
import { ListDesigner } from './List.Designer';
import { ListItem } from './List.Item';
import useStyles from './List.style';
import { useListActionBarProps } from './hooks';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';

const InternalList = (props) => {
  const { service } = useListBlockContext();
  const { run, params } = service;
  const fieldSchema = useFieldSchema();
  const Designer = useDesigner();
  const meta = service?.data?.meta;
  const field = useField<ArrayField>();
  const [schemaMap] = useState(new Map());
  const { wrapSSR, componentCls, hashId } = useStyles();

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

  return wrapSSR(
    <SchemaComponentOptions
      scope={{
        useListItemProps,
        useListActionBarProps,
      }}
    >
      <SortableItem className={cx('nb-list', componentCls, hashId)}>
        <AntdList
          {...props}
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
          {field.value?.length
            ? field.value.map((item, index) => {
                return (
                  <RecursionField
                    basePath={field.address}
                    key={index}
                    name={index}
                    onlyRenderProperties
                    schema={getSchema(index)}
                  ></RecursionField>
                );
              })
            : null}
        </AntdList>
        <Designer />
      </SortableItem>
    </SchemaComponentOptions>,
  );
};

export const List = withDynamicSchemaProps(InternalList) as typeof InternalList & {
  Item: typeof ListItem;
  Designer: typeof ListDesigner;
  Decorator: typeof ListBlockProvider;
};

List.Item = ListItem;
List.Designer = ListDesigner;
List.Decorator = ListBlockProvider;
