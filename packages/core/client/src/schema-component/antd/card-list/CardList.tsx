import React, { useCallback, useState } from 'react';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { css, cx } from '@emotion/css';
import { List as AntdList, Row, PaginationProps, Col } from 'antd';
import { useCardListActionBarProps } from './hooks';
import { SortableItem } from '../../common';
import { SchemaComponentOptions } from '../../core';
import { useDesigner } from '../../hooks';
import { CardListItem } from './CardList.Item';
import { useCardListBlockContext, useCardListItemProps, CardListBlockProvider } from './CardList.Decorator';
import { CardListDesigner } from './CardList.Designer';
import { ArrayField } from '@formily/core';
import { pageSizeOptions } from './options';

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

const InternalCardList = (props) => {
  const { service, columnCount = 1 } = useCardListBlockContext();
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
        useCardListItemProps,
        useCardListActionBarProps,
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
          loading={service?.loading}
        >
          <Row
            style={{ width: '100%' }}
            gutter={[
              {
                md: 16,
                sm: 8,
              },
              {
                md: 16,
                sm: 8,
              },
            ]}
          >
            {field.value?.map((item, index) => {
              return (
                <Col key={index} span={24 / columnCount}>
                  <RecursionField
                    basePath={field.address}
                    name={index}
                    onlyRenderProperties
                    schema={
                      {
                        type: 'object',
                        properties: {
                          [index]: fieldSchema.properties['item'],
                        },
                      } as any
                    }
                  ></RecursionField>
                </Col>
              );
            })}
          </Row>
        </AntdList>
        <Designer />
      </SortableItem>
    </SchemaComponentOptions>
  );
};

export const CardList = InternalCardList as typeof InternalCardList & {
  Item: typeof CardListItem;
  Designer: typeof CardListDesigner;
  Decorator: typeof CardListBlockProvider;
};

CardList.Item = CardListItem;
CardList.Designer = CardListDesigner;
CardList.Decorator = CardListBlockProvider;
