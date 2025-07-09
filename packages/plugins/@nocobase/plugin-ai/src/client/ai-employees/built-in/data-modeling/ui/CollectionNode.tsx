/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import { List, Card, Flex } from 'antd';
import { useApp, useToken } from '@nocobase/client';
import { useT } from '../../../../locale';
import { Schema } from '@formily/react';
import { KeyOutlined } from '@ant-design/icons';

export const CollectionNode = ({ data }) => {
  const { token } = useToken();
  const app = useApp();
  const t = useT();
  const fim = app.dataSourceManager.collectionFieldInterfaceManager;
  const handleStyle = {
    top: '50%',
    transform: 'translateY(-50%)',
    width: 8,
    height: 8,
    opacity: 0,
    pointerEvents: 'none' as const,
  };
  return (
    <Card
      size="small"
      title={
        <>
          {data.title}{' '}
          <span
            style={{
              fontSize: token.fontSizeSM,
              color: token.colorTextDescription,
            }}
          >
            {data.name}
          </span>
        </>
      }
      styles={{
        body: {
          padding: 0,
          minWidth: '200px',
        },
      }}
    >
      <List
        dataSource={data.fields}
        size="small"
        renderItem={(item: any) => {
          const fieldInterface = fim.getFieldInterface(item.interface);

          return (
            <List.Item
              style={{
                position: 'relative', // 为了定位 Handle
              }}
            >
              <Flex
                justify="space-between"
                gap="large"
                style={{
                  width: '100%',
                }}
              >
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${data.name}-${item.name}-source-right`}
                  style={handleStyle}
                />
                <Handle
                  type="source"
                  position={Position.Left}
                  id={`${data.name}-${item.name}-source-left`}
                  style={handleStyle}
                />

                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${data.name}-${item.name}-target-left`}
                  style={handleStyle}
                />
                <Handle
                  type="target"
                  position={Position.Right}
                  id={`${data.name}-${item.name}-target-right`}
                  style={handleStyle}
                />
                <Flex vertical={true}>
                  <div>
                    {item.title}
                    {item.primaryKey ? (
                      <KeyOutlined
                        style={{
                          marginLeft: '4px',
                        }}
                      />
                    ) : (
                      ''
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: token.fontSizeSM,
                      color: token.colorTextDescription,
                    }}
                  >
                    {item.name}
                  </div>
                </Flex>
                <Flex vertical={true} align="flex-end">
                  <div
                    style={{
                      fontSize: token.fontSizeSM,
                      color: token.colorTextSecondary,
                    }}
                  >
                    {fieldInterface?.title ? Schema.compile(fieldInterface.title, { t }) : ''}
                  </div>
                  <div
                    style={{
                      fontSize: token.fontSizeSM,
                      color: token.colorTextDescription,
                    }}
                  >
                    {item.type}
                  </div>
                </Flex>
              </Flex>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};
