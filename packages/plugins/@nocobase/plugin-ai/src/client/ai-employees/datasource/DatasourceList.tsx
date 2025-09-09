/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelContext, MultiRecordResource, observer, useFlowContext } from '@nocobase/flow-engine';
import React from 'react';
import { Checkbox, Divider, Flex, Result, Space, Typography, List } from 'antd';
import { Card } from 'antd';
import _ from 'lodash';
import { dayjs } from '@nocobase/utils/client';
import { ContextItem } from '../types';

const { Text } = Typography;

export type DatasourceListProps = {
  onSelect: (item) => void;
  onAdd: (item: Omit<ContextItem, 'type'>) => void;
  onRemove: (uid: string) => void;
};

export const DatasourceList: React.FC<DatasourceListProps> = observer(({ onSelect, onAdd, onRemove }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();
  const dataSource = ctx.resource.getData();

  return (
    <>
      <List
        style={{ height: '80vh', overflowY: 'auto' }}
        dataSource={dataSource}
        loading={ctx.resource.loading}
        pagination={{
          align: 'center',
          showSizeChanger: false,
          total: ctx.resource.getMeta('count'),
          pageSize: ctx.resource.getPageSize(),
          onChange: (page, pageSize) => {
            ctx.resource.setPage(page);
            ctx.resource.setPageSize(pageSize);
            ctx.resource.refresh();
          },
        }}
        renderItem={(item) => (
          <List.Item>
            <Card
              key={item.id}
              hoverable
              variant="borderless"
              style={{ minWidth: 280, display: 'flex', flexDirection: 'column' }}
              onClick={() => {
                onSelect(item);
              }}
            >
              <Card.Meta
                title={
                  <Flex justify="space-between" align="center">
                    <span>{item.title}</span>
                    <Checkbox
                      onChange={(e) => {
                        if (e.target.checked) {
                          onAdd({ uid: item.id });
                        } else {
                          onRemove(item.id);
                        }
                      }}
                    ></Checkbox>
                  </Flex>
                }
                description={
                  <Space style={{ fontSize: 13 }}>
                    <Text type="secondary">{ctx.t('Collection')}</Text>
                    <Text>{`${item.datasource}/${item.collectionName}`}</Text>
                    <Divider type="vertical" />
                    <Text type="secondary">{ctx.t('Limit')}</Text>
                    <Text>{item.limit}</Text>
                  </Space>
                }
              />
              <div
                style={{ width: 250, height: 80, display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 10 }}
              >
                <div style={{ width: '100%', height: 70 }}>
                  <Typography.Paragraph
                    type="secondary"
                    ellipsis={{
                      rows: 2,
                    }}
                  >
                    {item.description}
                  </Typography.Paragraph>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <Flex justify="space-between" align="center">
                    <Space style={{ fontSize: 10 }}>
                      <Text type="secondary">
                        {`${ctx.t('Created at')} ${dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}`}
                      </Text>
                    </Space>
                  </Flex>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </>
  );
});
