/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Card, Flex, List, theme } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useApp } from '@nocobase/client-v2';
import { useT } from '../../../locale';
import { compileLegacyTemplate } from './legacy-template';
import type { FieldDataType } from './types';

type CollectionNodeData = {
  title: string;
  name: string;
  fields: FieldDataType[];
};

const getHandleStyle = (token: ReturnType<typeof theme.useToken>['token']): React.CSSProperties => ({
  top: '50%',
  transform: 'translateY(-50%)',
  width: token.sizeXS,
  height: token.sizeXS,
  opacity: 0,
  pointerEvents: 'none',
});

export const CollectionNode: React.FC<NodeProps> = ({ data }) => {
  const { token } = theme.useToken();
  const app = useApp();
  const t = useT();
  const nodeData = data as CollectionNodeData;
  const manager = app.dataSourceManager.collectionFieldInterfaceManager;
  const handleStyle = getHandleStyle(token);

  return (
    <Card
      size="small"
      title={
        <div style={{ position: 'relative' }}>
          <Handle type="target" position={Position.Left} id={nodeData.name} style={handleStyle} />
          {nodeData.title}{' '}
          <span style={{ fontSize: token.fontSizeSM, color: token.colorTextDescription }}>{nodeData.name}</span>
          <Handle type="source" position={Position.Right} id={nodeData.name} style={handleStyle} />
        </div>
      }
      styles={{
        body: {
          padding: 0,
          minWidth: token.sizeXXL * 5,
        },
      }}
    >
      <List
        dataSource={nodeData.fields}
        size="small"
        renderItem={(item) => {
          const fieldInterface = item.interface ? manager?.getFieldInterface(item.interface) : undefined;

          return (
            <List.Item style={{ position: 'relative' }}>
              <Flex justify="space-between" gap={token.marginLG} style={{ width: '100%' }}>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${nodeData.name}-${item.name}`}
                  style={handleStyle}
                />
                <Flex vertical>
                  <div>
                    {item.title}
                    {item.primaryKey ? <KeyOutlined style={{ marginLeft: token.marginXXS }} /> : null}
                  </div>
                  <div style={{ fontSize: token.fontSizeSM, color: token.colorTextDescription }}>{item.name}</div>
                </Flex>
                <Flex vertical align="flex-end">
                  <div style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>
                    {fieldInterface?.title ? compileLegacyTemplate(fieldInterface.title, t) : ''}
                  </div>
                  <div style={{ fontSize: token.fontSizeSM, color: token.colorTextDescription }}>{item.type}</div>
                </Flex>
              </Flex>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};
