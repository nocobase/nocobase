/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Card } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { useT } from '../../../locale';
import { useToken } from '@nocobase/client';
import { useChatToolsStore } from '../../chatbox/stores/chat-tools';
import { ToolCall } from '../../types';
import { CollectionDataType } from '../types';

export const DataModelingCard: React.FC<{
  messageId: string;
  tool: ToolCall<{
    collections: CollectionDataType[];
  }>;
}> = ({ messageId, tool }) => {
  const t = useT();
  const { token } = useToken();

  const setOpen = useChatToolsStore.use.setOpenToolModal();
  const setActiveTool = useChatToolsStore.use.setActiveTool();
  const setActiveMessageId = useChatToolsStore.use.setActiveMessageId();
  const toolsByMessageId = useChatToolsStore.use.toolsByMessageId();
  const version = toolsByMessageId[messageId]?.[tool.id]?.version;

  return (
    <>
      <Card
        style={{
          marginBottom: '16px',
          cursor: 'pointer',
        }}
        onClick={() => {
          setActiveTool(tool);
          setActiveMessageId(messageId);
          setOpen(true);
        }}
      >
        <Card.Meta
          avatar={<DatabaseOutlined />}
          title={
            <>
              {t('Data modeling')}
              {version && version > 1 ? (
                <span
                  style={{
                    marginLeft: '8px',
                    color: token.colorTextDescription,
                    // fontSize: token.fontSizeSM,
                    fontWeight: 'normal',
                    fontStyle: 'italic',
                  }}
                >
                  {t('Version')} {version}
                </span>
              ) : null}
            </>
          }
          description={t('Please review and finish the process')}
        />
      </Card>
    </>
  );
};
