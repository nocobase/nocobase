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
  Modal,
  Pagination,
  Result,
  Space,
  Spin,
  Switch,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Card } from 'antd';
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
  const { token } = theme.useToken();
  const data = ctx.resource.getData();
  const total = ctx.resource.getMeta('count') ?? data.length;
  const pageSize = ctx.resource.getPageSize() || 16;
  const currentPage = ctx.resource.getPage() ?? 1;

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
        <div style={{ width: '100%', padding: token.paddingXS }}>
          <Flex vertical gap="large" style={{ width: '100%', minWidth: 0 }}>
            <Flex justify="flex-end" align="center">
              <AddButton icon={<PlusOutlined />} type="primary">
                <span>{ctx.t('Add datasource')}</span>
              </AddButton>
            </Flex>
            <Spin spinning={ctx.resource.loading}>
              <div
                style={{
                  display: 'grid',
                  gap: token.margin,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                }}
              >
                {data.map((item) => {
                  const createdAt = dayjs(item.createdAt);
                  const createdAtText = `${ctx.t('Created at')} ${createdAt.format('YYYY-MM-DD HH:mm:ss')}`;

                  return (
                    <Card
                      key={item.id}
                      hoverable
                      variant="borderless"
                      style={{ height: '100%', minWidth: 0 }}
                      styles={{
                        body: {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: token.margin,
                          height: '100%',
                          minWidth: 0,
                        },
                      }}
                      onClick={() => {
                        ctx.viewer.drawer({
                          width: '50%',
                          content: <DatasourceSettingDetail record={item} />,
                        });
                      }}
                    >
                      <Card.Meta
                        title={
                          <Flex justify="space-between" align="center" gap="small" style={{ minWidth: 0 }}>
                            <Typography.Text ellipsis={{ tooltip: item.title }} style={{ flex: 1, minWidth: 0 }}>
                              {item.title}
                            </Typography.Text>
                            <Switch
                              size="small"
                              checked={item.enabled}
                              onClick={async (checked, event) => {
                                event.stopPropagation();
                                await ctx.resource.update(item.id, {
                                  enabled: checked,
                                });
                              }}
                            />
                          </Flex>
                        }
                        description={
                          <Space size={token.marginXS} style={{ flexWrap: 'wrap', fontSize: token.fontSizeSM }}>
                            <Text type="secondary">{ctx.t('Collection')}</Text>
                            <Text ellipsis={{ tooltip: `${item.datasource}/${item.collectionName}` }}>
                              {`${item.datasource}/${item.collectionName}`}
                            </Text>
                            <Divider type="vertical" />
                            <Text type="secondary">{ctx.t('Limit')}</Text>
                            <Text>{item.limit}</Text>
                          </Space>
                        }
                      />
                      <div style={{ minHeight: `calc(${token.fontSize}px * ${token.lineHeight} * 2)` }}>
                        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                          {item.description}
                        </Typography.Paragraph>
                      </div>
                      <Flex
                        align="center"
                        gap="small"
                        justify="space-between"
                        style={{ marginTop: 'auto', minWidth: 0 }}
                      >
                        <Tooltip title={createdAtText}>
                          <Text
                            aria-label={createdAtText}
                            type="secondary"
                            style={{
                              flex: 1,
                              fontSize: token.fontSizeSM,
                              minWidth: 0,
                            }}
                            ellipsis
                          >
                            {`${ctx.t('Created at')} ${createdAt.format('YYYY-MM-DD')}`}
                          </Text>
                        </Tooltip>
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
                    </Card>
                  );
                })}
              </div>
            </Spin>
            {total > pageSize && (
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                showSizeChanger={false}
                style={{ display: 'flex', justifyContent: 'flex-end' }}
                total={total}
                onChange={(page, nextPageSize) => {
                  ctx.resource.setPage(page);
                  ctx.resource.setPageSize(nextPageSize);
                  ctx.resource.refresh();
                }}
              />
            )}
          </Flex>
        </div>
      )}
    </>
  );
});
