/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import { Plugin } from '@nocobase/client';
import { Button, Card, Col, Divider, Dropdown, Menu, Row, Space, Table, Tabs, Tag } from 'antd';
import React from 'react';

function Environments() {
  return (
    <div>
      <Card style={{ minHeight: '80vh' }}>
        <Row gutter={24}>
          <Col flex="300px">
            <Button
              block
              style={{ textAlign: 'left', marginTop: 10, marginBottom: 2 }}
              type="text"
              icon={<PlusOutlined />}
            >
              New environment
            </Button>
            <Divider style={{ margin: '0 0 12px' }} />
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              style={{ paddingRight: 24 }}
              items={[
                {
                  key: '1',
                  label: 'Development',
                  itemIcon: (
                    <>
                      <Tag bordered={false} color="green">
                        Default
                      </Tag>
                      <MoreOutlined />
                    </>
                  ),
                },
                {
                  key: '2',
                  label: <div>Production</div>,
                  itemIcon: <MoreOutlined />,
                },
              ]}
            />
            <br />
          </Col>
          <Col flex={'auto'}>
            <Tabs
              tabBarExtraContent={
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: '1',
                        label: 'Add variable',
                      },
                      {
                        key: '2',
                        label: 'Add secret',
                      },
                    ],
                  }}
                >
                  <Button type="primary" icon={<PlusOutlined />}>
                    Add new <DownOutlined />
                  </Button>
                </Dropdown>
              }
              defaultActiveKey="1"
              items={[
                {
                  key: '1',
                  label: 'Variables',
                  children: (
                    <div>
                      <Table
                        size="middle"
                        dataSource={[
                          {
                            name: 'BASE_URL',
                            value: 'http://www.nocobase.com/',
                          },
                          {
                            name: 'PG_PASSWORD',
                            value: '123',
                          },
                        ]}
                        pagination={false}
                        columns={[
                          {
                            title: 'Name',
                            dataIndex: 'name',
                          },
                          {
                            title: 'Value',
                            dataIndex: 'value',
                          },
                          {
                            title: 'Actions',
                            width: 200,
                            render: () => (
                              <Space>
                                <a>Edit</a>
                                <a>Delete</a>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: '2',
                  label: 'Secrets',
                  children: (
                    <div>
                      <Table
                        size="middle"
                        dataSource={[
                          {
                            name: 'BASE_URL',
                            value: 'http://www.nocobase.com/',
                          },
                          {
                            name: 'PG_PASSWORD',
                            value: '123',
                          },
                        ]}
                        pagination={false}
                        columns={[
                          {
                            title: 'Name',
                            dataIndex: 'name',
                          },
                          {
                            title: 'Actions',
                            width: 200,
                            render: () => (
                              <Space>
                                <a>Edit</a>
                                <a>Delete</a>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export class PluginEnvironmentVariablesClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.pluginSettingsManager.add('environments', {
      title: `{{t("Environments", { ns: "environments" })}}`,
      icon: 'TableOutlined',
      Component: Environments,
    });
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginEnvironmentVariablesClient;
