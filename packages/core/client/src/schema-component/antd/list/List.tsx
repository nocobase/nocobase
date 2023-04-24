import { ListDesigner } from './List.Designer';
import { ListBlockProvider, useListBlockContext, useListItemProps } from './List.Decorator';
import React from 'react';
import { useField, useFieldSchema } from '@formily/react';
import { css, cx } from '@emotion/css';
import { useInfiniteScroll } from 'ahooks';
import { Divider, Spin, Empty, List as AntdList, PaginationProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useListActionBarProps, useService } from './hooks';
import { useCollection } from '../../../collection-manager';
import { RecordProvider } from '../../../record-provider';
import { SortableItem } from '../../common';
import { SchemaComponentOptions, SchemaComponent } from '../../core';
import { useDesigner } from '../../hooks';
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
  const { t } = useTranslation();

  const { noMore, loadingMore, data, meta, loading } = useService();

  let endedMessage = 'More data coming soon';
  if (loadingMore) {
    endedMessage = t('loading more ~~~');
  } else if (noMore) {
    endedMessage = t('It is all, nothing more 🤐');
  }

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
          dataSource={data}
          pagination={{
            onChange: onPaginationChange,
            total: meta?.count || 0,
            pageSize: meta?.pageSize || 10,
          }}
          loading={service.loading ?? loading}
          renderItem={(item) => {
            return (
              <RecordProvider key={item[getPrimaryKey()]} record={item}>
                <SchemaComponent schema={fieldSchema}></SchemaComponent>
              </RecordProvider>
            );
          }}
        ></AntdList>
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
