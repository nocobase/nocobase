/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemoizedFn } from 'ahooks';
import { Button, Input, Modal, Table } from 'antd';
import type { TableProps } from 'antd';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../hooks/useApp';
import type { IPluginData } from './types';

interface BulkEnableButtonProps {
  plugins: IPluginData[];
}

export const BulkEnableButton: React.FC<BulkEnableButtonProps> = ({ plugins }) => {
  const { t } = useTranslation();
  const app = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const disabledPlugins = useMemo(() => plugins.filter((plugin) => !plugin.enabled), [plugins]);

  const items = useMemo(() => {
    const value = searchValue.toLowerCase().trim();
    if (!value) return disabledPlugins;
    return disabledPlugins.filter(
      (plugin) =>
        (plugin.displayName || '').toLowerCase().includes(value) ||
        (plugin.description || '').toLowerCase().includes(value),
    );
  }, [disabledPlugins, searchValue]);

  const handleOpen = useMemoizedFn(() => setIsModalOpen(true));

  const handleCancel = useMemoizedFn(() => {
    setSelectedRowKeys([]);
    setIsModalOpen(false);
  });

  const handleOk = useMemoizedFn(async () => {
    await app.apiClient.request({
      url: 'pm:enable',
      params: { filterByTk: selectedRowKeys },
    });
    setIsModalOpen(false);
  });

  const columns: TableProps<IPluginData>['columns'] = useMemo(
    () => [
      { title: t('Plugin'), dataIndex: 'displayName', ellipsis: true },
      { title: t('Description'), dataIndex: 'description', ellipsis: true, width: 300 },
      { title: t('Package name'), dataIndex: 'packageName', width: 300, ellipsis: true },
    ],
    [t],
  );

  return (
    <>
      <Button onClick={handleOpen}>{t('Bulk enable')}</Button>
      <Modal width={1000} title={t('Bulk enable')} open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <Input
          style={{ marginBottom: '1em' }}
          placeholder={t('Search plugin...')}
          allowClear
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <Table<IPluginData>
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys,
            onChange(selectedKeys) {
              const names = items.map((item) => item.name);
              setSelectedRowKeys((preSelectedRowKeys) => {
                if (selectedKeys.length === 0) {
                  return preSelectedRowKeys.filter((key) => !names.includes(String(key)));
                }
                if (selectedKeys.length === names.length) {
                  return _.uniq([...preSelectedRowKeys, ...selectedKeys]);
                }
                return preSelectedRowKeys;
              });
            },
            onSelect(record) {
              setSelectedRowKeys((preSelectedRowKeys) => {
                if (preSelectedRowKeys.includes(record.name)) {
                  return preSelectedRowKeys.filter((key) => key !== record.name);
                }
                return preSelectedRowKeys.concat(record.name);
              });
            },
          }}
          rowKey="name"
          scroll={{ y: '60vh' }}
          size="small"
          pagination={false}
          columns={columns}
          dataSource={items}
        />
      </Modal>
    </>
  );
};
