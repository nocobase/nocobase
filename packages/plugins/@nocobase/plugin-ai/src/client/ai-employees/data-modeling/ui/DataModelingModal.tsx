/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Tabs } from 'antd';
import { DatabaseOutlined, FileTextOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { useT } from '../../../locale';
import { CodeInternal } from '../../chatbox/markdown/Code';
import { Diagram } from './Diagram';
import { Table } from './Table';
import { useAPIClient, useApp } from '@nocobase/client';
import { ToolCall } from '../../types';
import { useChatToolsStore } from '../../chatbox/stores/chat-tools';
import { CollectionDataType, FieldDataType } from '../types';

const useCollections = (collections: CollectionDataType[]) => {
  const app = useApp();
  const fim = app.dataSourceManager.collectionFieldInterfaceManager;
  return useMemo(() => {
    const result = [];
    for (const collection of collections) {
      const fields =
        collection.fields?.map((field) => {
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
        }) || [];
      result.push({
        ...collection,
        hidden: false,
        fields,
      });
    }
    return result;
  }, [collections]);
};

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

const useUpdateTool = (
  tool: ToolCall<{
    collections: CollectionDataType[];
  }>,
  saveToolArgs: (args: unknown) => Promise<void>,
) => {
  const updateCollectionRecord = useCallback(
    async (collectionIndex: number, collection: CollectionDataType) => {
      const collections = [...tool.args.collections];
      if (!collections[collectionIndex]) {
        return;
      }
      collections[collectionIndex] = {
        ...collections[collectionIndex],
        ...collection,
      };
      saveToolArgs({ collections });
    },
    [tool, saveToolArgs],
  );

  const updateFieldRecord = useCallback(
    async (collectionIndex: number, fieldIndex: number, field: FieldDataType) => {
      const collections = [...tool.args.collections];
      if (!collections[collectionIndex]?.fields?.[fieldIndex]) {
        return;
      }
      const oldField = collections[collectionIndex].fields[fieldIndex];
      collections[collectionIndex].fields[fieldIndex] = {
        ...oldField,
        ...field,
      };
      saveToolArgs({ collections });
    },
    [tool, saveToolArgs],
  );

  return {
    updateCollectionRecord,
    updateFieldRecord,
  };
};

export const DataModelingModal: React.FC<{
  tool: ToolCall<{
    collections: CollectionDataType[];
  }>;
  saveToolArgs: (args: unknown) => Promise<void>;
}> = ({ tool, saveToolArgs }) => {
  const t = useT();
  const collections = useCollections(tool.args.collections);
  const setAdjustArgs = useChatToolsStore.use.setAdjustArgs();
  const { updateCollectionRecord, updateFieldRecord } = useUpdateTool(tool, saveToolArgs);

  useEffect(() => {
    setAdjustArgs({
      collections,
    });
  }, [collections, setAdjustArgs]);

  const items = [
    {
      key: 'collections',
      label: t('Collections'),
      icon: <DatabaseOutlined />,
      children: (
        <Table
          collections={collections}
          updateCollectionRecord={updateCollectionRecord}
          updateFieldRecord={updateFieldRecord}
        />
      ),
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
  return <Tabs defaultActiveKey="1" items={items} />;
};
