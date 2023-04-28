import { ListDesigner } from './List.Designer';
import { ListBlockProvider, useListBlockContext, useListItemProps } from './List.Decorator';
import React from 'react';
import { useFieldSchema } from '@formily/react';
import { css, cx } from '@emotion/css';
import { List as AntdList, PaginationProps } from 'antd';
import { useListActionBarProps } from './hooks';
import { useCollection } from '../../../collection-manager';
import { RecordProvider } from '../../../record-provider';
import { SortableItem } from '../../common';
import { SchemaComponentOptions, SchemaComponent } from '../../core';
import { useDesignable, useDesigner } from '../../hooks';
import { ListItem } from './List.Item';

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
  const fieldSchema = useFieldSchema();
  const Designer = useDesigner();
  const { getPrimaryKey } = useCollection();
  const meta = service?.data?.meta;
  const { designable } = useDesignable();

  const onPaginationChange: PaginationProps['onChange'] = (page, pageSize) => {
    service.run({
      ...service?.params?.[0],
      page: page,
      pageSize: pageSize,
    });
  };

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
                }
          }
          loading={service?.loading}
        >
          <div
            className={css`
              height: 50vh;
              overflow-y: scroll;
            `}
          >
            {service?.data?.data?.map((item) => (
              <RecordProvider key={item[getPrimaryKey()]} record={item}>
                <SchemaComponent memoized={!designable} schema={fieldSchema}></SchemaComponent>
              </RecordProvider>
            ))}
          </div>
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
