/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Generating } from '../../../chatbox/markdown/Generating';
import { Card, Modal, Tabs } from 'antd';
import { DatabaseOutlined, FileTextOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { useT } from '../../../../locale';
import { CodeInternal } from '../../../chatbox/markdown/Code';
import { Diagram } from './Diagram';
import { Table } from './Table';
import { useAPIClient, useApp, useToken } from '@nocobase/client';
import { useChatToolsStore } from '../../../chatbox/stores/chat-tools';
import { ToolCall } from '../../../types';

const TabPane: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div
      style={{
        height: '70vh',
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  );
};

export const DataModelingModal: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  collections: any[];
}> = ({ open, setOpen, collections }) => {
  const t = useT();
  const api = useAPIClient();
  const app = useApp();
  const fim = app.dataSourceManager.collectionFieldInterfaceManager;

  const items = [
    {
      key: 'collections',
      label: t('Collections'),
      icon: <DatabaseOutlined />,
      children: <Table collections={collections} />,
    },
    {
      key: 'graph',
      icon: <NodeIndexOutlined />,
      label: t('Diagram'),
      children: (
        <TabPane>
          <Diagram collections={collections} />
        </TabPane>
      ),
    },
    {
      key: 'definition',
      icon: <FileTextOutlined />,
      label: 'Definition',
      children: (
        <TabPane>
          <CodeInternal language="json" value={JSON.stringify(collections, null, 2)} />
        </TabPane>
      ),
    },
  ];
  return (
    <Modal
      open={open}
      width="90%"
      onCancel={() => {
        setOpen(false);
      }}
      okText={t('Finish review and apply')}
      onOk={async () => {
        await api.resource('ai').defineCollections({
          values: {
            collections,
          },
        });
        setOpen(false);
      }}
    >
      <Tabs defaultActiveKey="1" items={items} />
    </Modal>
  );
};

const useCollections = (collections: any[]) => {
  const app = useApp();
  const fim = app.dataSourceManager.collectionFieldInterfaceManager;
  return useMemo(() => {
    const result = [];
    for (const collection of collections) {
      const fields = collection.fields.map((field: any) => {
        const fieldInterface = fim.getFieldInterface(field.interface);
        if (fieldInterface) {
          field.type = fieldInterface.default?.type || field.type;
          field.uiSchema = fieldInterface.default?.uiSchema || field.uiSchema;
        }
        field.uiSchema = {
          ...field.uiSchema,
          title: field.title,
        };
        if (field.enum) {
          field.uiSchema = {
            ...field.uiSchema,
            enum: field.enum,
          };
        }
        return field;
      });
      result.push({
        ...collection,
        fields,
      });
    }
    return result;
  }, [collections]);
};

export const Collections: React.FC<{
  messageId: string;
  tool: ToolCall<{
    collections: [];
  }>;
}> = ({ messageId, tool }) => {
  const t = useT();
  const { token } = useToken();
  const [open, setOpen] = React.useState(false);
  const collections = useCollections(tool.args.collections);

  const toolsByMessageId = useChatToolsStore.use.toolsByMessageId();
  const version = toolsByMessageId[messageId]?.[tool.id]?.version;

  return (
    <>
      <Card
        style={{
          marginBottom: '16px',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(true)}
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
                  {t('version')} {version}
                </span>
              ) : null}
            </>
          }
          description={t('Please review and finish the process')}
        />
      </Card>
      <DataModelingModal open={open} setOpen={setOpen} collections={collections} />
    </>
  );
};
