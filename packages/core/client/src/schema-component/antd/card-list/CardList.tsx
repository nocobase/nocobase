import React, { useRef } from 'react';
import { useField, useFieldSchema } from '@formily/react';
import { css, cx } from '@emotion/css';
import { Col, Divider, Empty, Row, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCardListActionBarProps } from './hooks';
import { useCollection } from '../../../collection-manager';
import { RecordProvider } from '../../../record-provider';
import { SortableItem } from '../../common';
import { SchemaComponentOptions, SchemaComponent } from '../../core';
import { useDesigner } from '../../hooks';
import { useInfiniteScroll } from 'ahooks';
import { CardListItem } from './CardList.Item';
import { useCardListBlockContext, useCardListItemProps, CardListBlockProvider } from './CardList.Decorator';
import { CardListDesigner } from './CardList.Designer';

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
  const fieldSchema = useFieldSchema();
  const field = useField();
  const Designer = useDesigner();
  const { getPrimaryKey } = useCollection();
  const { t } = useTranslation();
  const scrollEl = useRef<HTMLDivElement>();

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
      target: scrollEl,
      isNoMore: (d) => {
        const total = d?.meta?.total;
        const pageSize = d?.meta?.pageSize;
        const curSize = d?.list?.length;
        return curSize !== pageSize || curSize === total;
      },
      reloadDeps: [field.decoratorProps?.params],
    },
  );

  let endedMessage = 'More data coming soon';
  if (loadingMore) {
    endedMessage = t('loading more ~~~');
  } else if (noMore) {
    endedMessage = t('It is all, nothing more 🤐');
  }

  return (
    <SchemaComponentOptions
      scope={{
        useCardListItemProps,
        useCardListActionBarProps,
      }}
    >
      <SortableItem className={cx('nb-card-list', designerCss)}>
        {data?.list?.length ? (
          <div
            className={cx(
              'nb-card-list-content',
              css`
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                overflow-y: auto;
                height: 50vh;
              `,
            )}
            ref={scrollEl}
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
              {data?.list?.map((item) => {
                return (
                  <RecordProvider key={item[getPrimaryKey()]} record={item}>
                    <Col span={24 / columnCount}>
                      <SchemaComponent schema={fieldSchema}></SchemaComponent>
                    </Col>
                  </RecordProvider>
                );
              })}
            </Row>
            <Divider plain>{endedMessage}</Divider>
          </div>
        ) : (
          <div
            className={css`
              height: 100%;
              display: flex;
              height: 50vh;
              justify-content: center;
              align-items: center;
            `}
          >
            {loading ? <Spin /> : <Empty />}
          </div>
        )}
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
