import { ListDesigner } from './List.Designer';
import { ListBlockProvider, useListBlockContext, useListItemProps } from './List.Decorator';
import React from 'react';
import { useField, useFieldSchema } from '@formily/react';
import { css, cx } from '@emotion/css';
import { useInfiniteScroll } from 'ahooks';
import { Divider, Spin, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { useListActionBarProps } from './hooks';
import { useCollection } from '../../../collection-manager';
import { RecordProvider } from '../../../record-provider';
import { SortableItem } from '../../common';
import { SchemaComponentOptions, SchemaComponent } from '../../core';
import { useDesigner } from '../../hooks';
import { FormV2 } from '../form-v2';

const InternalList = (props) => {
  const { service } = useListBlockContext();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const Designer = useDesigner();
  const { getPrimaryKey } = useCollection();
  const { t } = useTranslation();

  const { data, loading, loadingMore, noMore } = useInfiniteScroll(
    async (d) => {
      const data = await service.runAsync({
        ...service?.params?.[0],
        page: d ? d.meta.page + 1 : 1,
      });
      return {
        list: data?.data,
        meta: data?.meta,
      };
    },
    {
      threshold: 200,
      target: window.document.querySelector('#nb-mobile-scroll-wrapper'),
      isNoMore: (d) => {
        const total = d?.meta?.total;
        const pageSize = d?.meta?.pageSize;
        const curSize = d?.list?.length;
        return curSize !== pageSize || curSize === total;
      },
      reloadDeps: [field.decoratorProps?.params],
    },
  );

  if (loading) {
    return <Spin />;
  }

  let endedMessage = 'More data coming soon';
  if (loadingMore) {
    endedMessage = t('loading more ~~~');
  } else if (noMore) {
    endedMessage = t('It is all, nothing more 🤐');
  }

  return (
    <SchemaComponentOptions
      scope={{
        useListItemProps,
        useListActionBarProps,
      }}
    >
      <SortableItem
        className={cx(
          'nb-mobile-list',
          css`
            width: 100%;
            margin-bottom: var(--nb-spacing);
          `,
        )}
      >
        <div
          className={cx(
            'nb-mobile-list-content',
            css`
              display: flex;
              flex-direction: column;
              padding: 0 var(--nb-spacing);
              width: 100%;
              // max-height: 100vh;
              overflow-y: auto;
            `,
          )}
        >
          {data?.list?.length ? (
            <>
              {data?.list?.map((item) => {
                return (
                  <RecordProvider key={item[getPrimaryKey()]} record={item}>
                    <SchemaComponent schema={fieldSchema}></SchemaComponent>
                  </RecordProvider>
                );
              })}
              <Divider plain>{endedMessage}</Divider>
            </>
          ) : (
            <div
              className={css`
                padding: 0 20px;
              `}
            >
              <Empty />
            </div>
          )}
        </div>
        <Designer />
      </SortableItem>
    </SchemaComponentOptions>
  );
};

export const List = InternalList as typeof InternalList & {
  Item: typeof FormV2;
  Designer: typeof ListDesigner;
  Decorator: typeof ListBlockProvider;
};

List.Item = FormV2;
List.Designer = ListDesigner;
List.Decorator = ListBlockProvider;
