/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FileOutlined, FolderOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Alert, Button, Card, Empty, Input, Tree, Typography, theme } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { Key } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useFlowContext } from '@nocobase/flow-engine';
import { useT } from '../locale';

const { Paragraph, Text } = Typography;

type Log = string | LogDir;

type LogDir = {
  name: string;
  files: Log[];
};

type LoggerListResponse = {
  data?: {
    data?: Log[];
  };
};

type TreeSearchNode = DataNode & {
  title: string | React.ReactNode;
  key: Key;
  children?: TreeSearchNode[];
};

const Tips = React.memo(() => {
  const t = useT();

  return (
    <Typography>
      <Paragraph>
        <Text code>request_*.log</Text> - {t('API request and response logs')}
      </Paragraph>
      <Paragraph>
        <Text code>system_*.log</Text> -{' '}
        {t('Application, database, plugins and other system logs, the error level logs will be sent to')}{' '}
        <Text code>system_error_*.log</Text>
      </Paragraph>
      <Paragraph>
        <Text code>sql_*.log</Text> - {t('SQL execution logs, printed by Sequelize when the db logging is enabled')}
      </Paragraph>
    </Typography>
  );
});

Tips.displayName = 'Tips';

function getCheckedKeys(keys: Key[] | { checked: Key[]; halfChecked: Key[] }) {
  if (Array.isArray(keys)) {
    return keys.map(String);
  }

  return keys.checked.map(String);
}

export default function LogsDownloader() {
  const t = useT();
  const { api } = useFlowContext();
  const { token } = theme.useToken();
  const [expandedKeys, setExpandedKeys] = useState<Key[]>(['0']);
  const [searchValue, setSearchValue] = useState('');
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const treeContainerStyle = useMemo(
    () => ({
      overflow: 'auto' as const,
      border: `${token.lineWidth}px solid ${token.colorBorder}`,
      borderRadius: token.borderRadiusLG,
      padding: token.paddingXS,
      maxHeight: 400,
      width: 450,
      marginTop: 6,
      marginBottom: 10,
    }),
    [token.borderRadiusLG, token.colorBorder, token.lineWidth, token.paddingXS],
  );

  const highlightStyle = useMemo(
    () => ({
      color: token.colorPrimary,
    }),
    [token.colorPrimary],
  );

  const { data } = useRequest(async () => {
    const response = (await api.resource('logger').list()) as LoggerListResponse;
    return response.data?.data || [];
  });

  const dataToTree = useCallback((logs: Log[], parent: string): TreeSearchNode[] => {
    return logs.map((log, index) => {
      const key = `${parent}-${index}`;

      if (typeof log === 'string') {
        return {
          title: log,
          key,
          icon: <FileOutlined />,
        };
      }

      return {
        title: log.name,
        key,
        icon: <FolderOutlined />,
        children: dataToTree(log.files, key),
      };
    });
  }, []);

  const defaultTree = useMemo<TreeSearchNode[]>(() => {
    return [
      {
        title: t('All'),
        key: '0',
        children: dataToTree(data || [], '0'),
      },
    ];
  }, [data, dataToTree, t]);

  const onSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const search = (nodes: TreeSearchNode[]): TreeSearchNode[] => {
        return nodes.reduce<TreeSearchNode[]>((acc, node) => {
          if (typeof node.title === 'string' && node.title.includes(value)) {
            acc.push(node);
          }

          if (node.children) {
            return [...acc, ...search(node.children)];
          }

          return acc;
        }, []);
      };

      const nextExpandedKeys = search(defaultTree).map((node) => node.key);
      setExpandedKeys(nextExpandedKeys);
      setSearchValue(value);
      setAutoExpandParent(true);
      setCheckedKeys([]);
    },
    [defaultTree],
  );

  const treeData = useMemo<TreeSearchNode[]>(() => {
    if (!searchValue) {
      return defaultTree;
    }

    const match = (nodes: TreeSearchNode[]): TreeSearchNode[] => {
      const matched: TreeSearchNode[] = [];

      for (const node of nodes) {
        if (typeof node.title !== 'string') {
          continue;
        }

        const index = node.title.indexOf(searchValue);
        const before = node.title.slice(0, index);
        const after = node.title.slice(index + searchValue.length);
        const title =
          index > -1 ? (
            <span>
              {before}
              <span style={highlightStyle}>{searchValue}</span>
              {after}
            </span>
          ) : (
            <span>{node.title}</span>
          );

        if (index > -1) {
          matched.push({ ...node, title });
          continue;
        }

        if (!node.children) {
          continue;
        }

        const children = match(node.children);
        if (children.length) {
          matched.push({ ...node, title, children });
        }
      }

      return matched;
    };

    return match(defaultTree);
  }, [defaultTree, highlightStyle, searchValue]);

  const handleDownload = useCallback(async () => {
    const getValues = (nodes: TreeSearchNode[], parent: string) => {
      return nodes.reduce<string[]>((acc, node) => {
        if (typeof node.title !== 'string') {
          return acc;
        }

        const title = node.key === '0' ? node.title : `${parent}/${node.title}`;

        if (node.children) {
          return [...acc, ...getValues(node.children, node.key === '0' ? '' : title)];
        }

        if (checkedKeys.includes(String(node.key)) && node.key !== '0') {
          acc.push(title);
        }

        return acc;
      }, []);
    };

    const files = getValues(defaultTree, '');
    if (!files.length) {
      return;
    }

    try {
      const response = await api.request({
        url: 'logger:download',
        method: 'post',
        responseType: 'blob',
        data: {
          files,
        },
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/gzip' }));
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'logs.tar.gz');
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
    }
  }, [api, checkedKeys, defaultTree]);

  return (
    <Card>
      <Alert message="" description={<Tips />} type="info" showIcon />
      <Input.Search placeholder={t('Search')} onChange={onSearch} style={{ marginTop: 16, width: '450px' }} />
      <div style={treeContainerStyle}>
        {treeData.length ? (
          <Tree
            checkable
            showIcon
            showLine
            checkedKeys={checkedKeys}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            onExpand={(keys) => {
              setExpandedKeys(keys);
              setAutoExpandParent(false);
            }}
            onCheck={(keys) => setCheckedKeys(getCheckedKeys(keys))}
            treeData={treeData}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
      <Button type="primary" onClick={handleDownload}>
        {t('Download')} (.tar.gz)
      </Button>
    </Card>
  );
}
