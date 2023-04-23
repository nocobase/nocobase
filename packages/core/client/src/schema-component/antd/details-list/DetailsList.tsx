import {
  FormV2,
  RecordProvider,
  SchemaComponent,
  SchemaComponentOptions,
  SortableItem,
  useCollection,
  useDesigner,
  useProps,
} from '@nocobase/client';
import { DetailsListDesigner } from './DetailsList.Designer';
import { DetailsListBlockProvider, useDetailsListBlockContext, useDetailsListItemProps } from './DetailsList.Decorator';
import React from 'react';
import { useField, useFieldSchema } from '@formily/react';
import { css, cx } from '@emotion/css';
import { useInfiniteScroll } from 'ahooks';
import { Divider, Spin, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDetailsListActionBarProps } from './hooks';

const InternalDetailsList = (props) => {
  const { service } = useDetailsListBlockContext();
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
        useDetailsListItemProps,
        useDetailsListActionBarProps,
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

export const DetailsList = InternalDetailsList as typeof InternalDetailsList & {
  Item: typeof FormV2;
  Designer: typeof DetailsListDesigner;
  Decorator: typeof DetailsListBlockProvider;
};

DetailsList.Item = FormV2;
DetailsList.Designer = DetailsListDesigner;
DetailsList.Decorator = DetailsListBlockProvider;
