/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, RightOutlined } from '@ant-design/icons';
import { observer } from '@formily/reactive-react';
import { css, useEventFlowList, useToken } from '@nocobase/client';
import { Button, Checkbox, Flex, List, Space, Switch, Typography } from 'antd';
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventFlowContext } from './EventFlowProvider';

export const EventFlowList = observer((props) => {
  const { token } = useToken();
  const navigate = useNavigate();
  const { setActive } = useContext(EventFlowContext);
  const flows = useEventFlowList();
  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', padding: `0 ${token.marginBlock}px` }}>
      <List
        className={css`
          .ant-list-items {
            height: calc(100vh - 90px);
            overflow: auto;
          }
          .ant-list-pagination-align-end {
            padding-top: ${token.marginBlock}px;
            margin: 0;
            padding-top: ${token.marginBlock / 2}px;
            border-block-start: 1px solid rgba(5, 5, 5, 0.06);
          }
          .ant-empty {
            line-height: calc(100vh - 200px);
          }
        `}
        header={
          <Flex justify="space-between">
            <Space size={8}>
              <CloseOutlined
                onClick={() => {
                  setActive(false);
                }}
              />
              <Typography.Title level={5} style={{ margin: '3px 0' }}>
                Eventflow
              </Typography.Title>
            </Space>
            <Space size={token.marginBlock / 2}>
              {flows.length > 0 && <Button>Delete</Button>}
              {flows.length > 0 && <Button>Filter</Button>}
              <Button
                type="primary"
                onClick={() => {
                  navigate(`/eventflow/new`);
                }}
              >
                Add new
              </Button>
            </Space>
          </Flex>
        }
        pagination={{ pageSize: 100 }}
        bordered={false}
        dataSource={flows}
        renderItem={(flow) => {
          return (
            <List.Item
              className={css`
                cursor: pointer;
                &:hover {
                  background: #fafafa;
                }
              `}
              onClick={() => {
                navigate(`/eventflow/${flow.key}`);
              }}
            >
              <Flex style={{ width: '100%' }} justify="space-between">
                <Space size={token.marginBlock / 2}>
                  <Checkbox />
                  {flow.get('title') || 'Untitled'}
                </Space>
                <Space size={token.marginBlock / 2}>
                  <Switch
                    size="small"
                    onClick={(checked, event) => {
                      event.stopPropagation();
                    }}
                  />
                  <RightOutlined style={{ paddingRight: token.marginBlock / 2 }} />
                </Space>
              </Flex>
            </List.Item>
          );
        }}
      />
    </div>
  );
});
