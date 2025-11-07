/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { PropsWithChildren } from 'react';
import { FlowModelContext, MultiRecordResource, observer, useFlowContext } from '@nocobase/flow-engine';
import {
  Button,
  ButtonProps,
  Divider,
  Empty,
  Flex,
  List,
  Modal,
  Result,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Card, Col, Row } from 'antd';
import _ from 'lodash';
import { dayjs } from '@nocobase/utils/client';
import { DatasourceSettingForm } from './DatasourceSettingForm';
import { DatasourceSettingDetail } from './DatasourceSettingDetail';

const { Text } = Typography;

const AddButton: React.FC<PropsWithChildren<ButtonProps>> = ({ children, ...props }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource; selectedRowKeys: Array<string> }>();
  return (
    <Button
      {...props}
      onClick={() => {
        ctx.viewer.drawer({
          width: '50%',
          content: <DatasourceSettingForm />,
        });
      }}
    >
      {children}
    </Button>
  );
};

export const DatasourceSettingGrid: React.FC = observer(() => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource; selectedRowKeys: Array<string> }>();
  const data = ctx.resource.getData();

  return (
    <>
      {data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
          <Card style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <AddButton icon={<PlusOutlined />} type="primary">
                <span>{ctx.t('Create a new datasource')}</span>
              </AddButton>
            </Empty>
          </Card>
        </div>
      ) : (
        <div style={{ width: '100%', overflowX: 'auto', padding: 8 }}>
          <Space direction="vertical" size="large" style={{ width: '100%', minWidth: 1200 }}>
            <Flex justify="flex-end" align="center">
              <Space>
                <AddButton icon={<PlusOutlined />} type="primary">
                  <span>{ctx.t('Add datasource')}</span>
                </AddButton>
              </Space>
            </Flex>
            <List
              grid={{ gutter: 16, column: 4 }}
              dataSource={data}
              loading={ctx.resource.loading}
              pagination={{
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
                    hoverable
                    variant="borderless"
                    style={{ minWidth: 300, display: 'flex', flexDirection: 'column' }}
                    onClick={() => {
                      ctx.viewer.drawer({
                        width: '50%',
                        content: <DatasourceSettingDetail record={item} />,
                      });
                    }}
                  >
                    <Card.Meta
                      title={
                        <Flex justify="space-between" align="center">
                          <span>{item.title}</span>
                          <Switch
                            size="small"
                            defaultValue={item.enabled}
                            onClick={async (checked, event) => {
                              event.stopPropagation();
                              await ctx.resource.update(item.id, {
                                enabled: checked,
                              });
                            }}
                          ></Switch>
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
                    <div style={{ height: 100, display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 10 }}>
                      <div style={{ width: '100%', height: 90 }}>
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
                          <Tooltip title={ctx.t('Delete')}>
                            <Button
                              type="link"
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                Modal.confirm({
                                  title: ctx.t('Confirm whether to delete'),
                                  icon: <ExclamationCircleFilled />,
                                  content: ctx.t('Are you sure delete this datasource?'),
                                  okText: ctx.t('Yes'),
                                  okType: 'danger',
                                  cancelText: ctx.t('No'),
                                  async onOk() {
                                    await ctx.resource.destroy(item.id);
                                    ctx.message.success(ctx.t('Datasource deleted successfully'));
                                  },
                                  onCancel() {},
                                });
                              }}
                            />
                          </Tooltip>
                        </Flex>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </Space>
        </div>
      )}
    </>
  );
});
