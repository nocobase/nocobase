/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { ArrayField } from '@formily/core';
import { Schema, useField, useFieldSchema } from '@formily/react';
import { List as AntdList, PaginationProps, theme } from 'antd';
import React, { useCallback, useState } from 'react';
import { getCardItemSchema } from '../../../block-provider';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { withSkeletonComponent } from '../../../hoc/withSkeletonComponent';
import { SortableItem } from '../../common';
import { SchemaComponentOptions } from '../../core';
import { useDesigner } from '../../hooks';
import { ListBlockProvider, useListBlockContext, useListItemProps } from './List.Decorator';
import { ListDesigner } from './List.Designer';
import { ListItem } from './List.Item';
import useStyles from './List.style';
import { useListActionBarProps, useListBlockHeight } from './hooks';
import { useMobileLayout } from '../../../route-switch/antd/admin-layout';
import { transformMultiColumnToSingleColumn } from '@nocobase/utils/client';

const InternalList = withSkeletonComponent(
  (props) => {
    const { service } = useListBlockContext();
    const { run, params } = service;
    const fieldSchema = useFieldSchema();
    const Designer = useDesigner();
    const meta = service?.data?.meta;
    const { pageSize, count, hasNext, page } = meta || {};
    const field = useField<ArrayField>();
    const [schemaMap] = useState(new Map());
    const { wrapSSR, componentCls, hashId } = useStyles();
    const height = useListBlockHeight();
    const { token } = theme.useToken();
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

    const pageSizeOptions = [5, 10, 20, 50, 100, 200];

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
    const cardItemSchema = getCardItemSchema?.(fieldSchema);
    const {
      layout = 'vertical',
      labelAlign = 'left',
      labelWidth = 120,
      labelWrap = true,
    } = cardItemSchema?.['x-component-props'] || {};
    const usePagination = () => {
      if (!count) {
        return {
          onChange: onPaginationChange,
          total: count || field.value?.length < pageSize || !hasNext ? pageSize * page : pageSize * page + 1,
          pageSize: pageSize || 10,
          current: page || 1,
          showSizeChanger: true,
          pageSizeOptions,
          simple: true,
          className: css`
            .ant-pagination-simple-pager {
              display: none !important;
            }
          `,
          itemRender: (_, type, originalElement) => {
            if (type === 'prev') {
              return (
                <div
                  style={{ display: 'flex' }}
                  className={css`
                    .ant-pagination-item-link {
                      min-width: ${token.controlHeight}px;
                    }
                  `}
                >
                  {originalElement} <div style={{ marginLeft: '7px' }}>{page}</div>
                </div>
              );
            } else {
              return originalElement;
            }
          },
        };
      }
      return {
        onChange: onPaginationChange,
        total: count || 0,
        pageSize: pageSize || 10,
        current: page || 1,
        showSizeChanger: true,
        pageSizeOptions,
      };
    };
    const paginationProps = usePagination();
    const { isMobileLayout } = useMobileLayout();

    return wrapSSR(
      <SchemaComponentOptions
        scope={{
          useListItemProps,
          useListActionBarProps,
        }}
      >
        <SortableItem
          className={cx(
            'nb-list',
            componentCls,
            hashId,
            css`
              .nb-list-container {
                height: ${height ? height + 'px' : '100%'};
                overflow-y: ${height ? 'auto' : null};
                margin-left: -${token.marginLG}px;
                margin-right: -${token.marginLG}px;
                padding-left: ${token.marginLG}px;
                padding-right: ${token.marginLG}px;
              }
            `,
          )}
        >
          <div className="nb-list-container">
            <FormLayout
              layout={layout}
              labelAlign={labelAlign}
              labelWidth={layout === 'horizontal' ? labelWidth : null}
              labelWrap={labelWrap}
            >
              <AntdList
                {...props}
                pagination={!meta || !field.value?.length || count <= field.value?.length ? false : paginationProps}
                loading={service?.loading}
              >
                {field.value?.length
                  ? field.value.map((item, index) => {
                      return (
                        <NocoBaseRecursionField
                          basePath={field.address}
                          key={index}
                          name={index}
                          onlyRenderProperties
                          schema={
                            isMobileLayout ? transformMultiColumnToSingleColumn(getSchema(index)) : getSchema(index)
                          }
                        ></NocoBaseRecursionField>
                      );
                    })
                  : null}
              </AntdList>
            </FormLayout>
          </div>
          <Designer />
        </SortableItem>
      </SchemaComponentOptions>,
    );
  },
  {
    displayName: 'InternalList',
  },
);

export const List = withDynamicSchemaProps(InternalList) as typeof InternalList & {
  Item: typeof ListItem;
  Designer: typeof ListDesigner;
  Decorator: typeof ListBlockProvider;
};

List.Item = ListItem;
List.Designer = ListDesigner;
List.Decorator = ListBlockProvider;
