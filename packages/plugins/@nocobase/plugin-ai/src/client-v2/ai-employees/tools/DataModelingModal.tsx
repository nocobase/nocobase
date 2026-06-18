/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, Tabs, theme } from 'antd';
import { DatabaseOutlined, FileTextOutlined, NodeIndexOutlined } from '@ant-design/icons';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useApp, useGlobalTheme, type ToolCall, type ToolsUIProperties } from '@nocobase/client-v2';
import { useT } from '../../locale';
import { useChatToolsStore } from '../chatbox/stores/chat-tools';
import { Diagram } from './data-modeling/Diagram';
import { Table } from './data-modeling/Table';
import type { CollectionDataType, DataModelingArgs, FieldDataType } from './data-modeling/types';

const normalizeCollections = (collections: DataModelingArgs['collections']): CollectionDataType[] | null => {
  if (Array.isArray(collections)) {
    return collections;
  }
  if (typeof collections !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(collections) as unknown;
    return Array.isArray(parsed) ? (parsed as CollectionDataType[]) : null;
  } catch {
    return null;
  }
};

const TabPane: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = theme.useToken();
  return (
    <div style={{ height: `calc(100vh - ${token.controlHeightLG + token.marginXXL * 7}px)`, overflowY: 'auto' }}>
      {children}
    </div>
  );
};

const useCollections = (collections: CollectionDataType[] | null) => {
  const app = useApp();
  return useMemo(() => {
    const manager = app.dataSourceManager.collectionFieldInterfaceManager;
    return (collections || []).map((collection) => ({
      ...collection,
      hidden: false,
      fields:
        collection.fields?.map((field) => {
          const fieldInterface = field.interface ? manager?.getFieldInterface(field.interface) : undefined;
          const fieldDefaults = (fieldInterface?.default || {}) as {
            type?: string;
            uiSchema?: Record<string, unknown>;
          };
          const uiSchema = {
            ...fieldDefaults.uiSchema,
            ...field.uiSchema,
            title: field.title,
            ...(field.enum ? { enum: field.enum } : {}),
          };
          return {
            ...field,
            type: field.type || fieldDefaults.type,
            uiSchema,
          };
        }) || [],
    }));
  }, [app.dataSourceManager.collectionFieldInterfaceManager, collections]);
};

const useUpdateTool = (tool: ToolCall<DataModelingArgs>, saveToolArgs?: (args: unknown) => Promise<void>) => {
  const updateCollectionRecord = useCallback(
    async (collectionIndex: number, collection: CollectionDataType) => {
      const collections = normalizeCollections(tool.args.collections);
      if (!collections?.[collectionIndex]) {
        return;
      }
      const nextCollections = [...collections];
      nextCollections[collectionIndex] = {
        ...nextCollections[collectionIndex],
        ...collection,
      };
      await saveToolArgs?.({ ...tool.args, collections: nextCollections });
    },
    [saveToolArgs, tool.args],
  );

  const updateFieldRecord = useCallback(
    async (collectionIndex: number, fieldIndex: number, field: FieldDataType) => {
      const collections = normalizeCollections(tool.args.collections);
      if (!collections?.[collectionIndex]?.fields?.[fieldIndex]) {
        return;
      }
      const nextCollections = [...collections];
      const fields = [...nextCollections[collectionIndex].fields];
      fields[fieldIndex] = {
        ...fields[fieldIndex],
        ...field,
      };
      nextCollections[collectionIndex] = {
        ...nextCollections[collectionIndex],
        fields,
      };
      await saveToolArgs?.({ ...tool.args, collections: nextCollections });
    },
    [saveToolArgs, tool.args],
  );

  return { updateCollectionRecord, updateFieldRecord };
};

export const useDataModelingOnOk = (decisions: ToolsUIProperties['decisions'], adjustArgs: Record<string, unknown>) => {
  const app = useApp();
  return {
    onOk: async () => {
      await decisions.edit(adjustArgs);
      app.dataSourceManager.getDataSource?.('main')?.reload?.();
    },
  };
};

export const DataModelingModal: React.FC<{
  tool: ToolCall<DataModelingArgs>;
  saveToolArgs?: (args: unknown) => Promise<void>;
}> = ({ tool, saveToolArgs }) => {
  const t = useT();
  const { isDarkTheme } = useGlobalTheme();
  const collections = useCollections(normalizeCollections(tool.args.collections));
  const setAdjustArgs = useChatToolsStore.use.setAdjustArgs();
  const { updateCollectionRecord, updateFieldRecord } = useUpdateTool(tool, saveToolArgs);

  useEffect(() => {
    setAdjustArgs({
      ...tool.args,
      collections,
    });
  }, [collections, setAdjustArgs, tool.args]);

  if (!normalizeCollections(tool.args.collections)) {
    return <Alert showIcon type="error" message={t('Invalid definition')} />;
  }

  return (
    <Tabs
      defaultActiveKey="collections"
      items={[
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
              <SyntaxHighlighter language="json" style={isDarkTheme ? dark : defaultStyle}>
                {JSON.stringify(collections, null, 2)}
              </SyntaxHighlighter>
            </TabPane>
          ),
        },
      ]}
    />
  );
};
