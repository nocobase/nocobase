/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, Drawer, Transfer, Input, message, App, Spin } from 'antd';
import { ImportOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';

interface CollectionItem {
  key: string;
  title: string;
  name: string;
  description?: string;
}

interface LoadCollectionProps {
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
  [key: string]: any;
}

export const LoadCollection: React.FC<LoadCollectionProps> = (props) => {
  const { ...restProps } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableCollections, setAvailableCollections] = useState<CollectionItem[]>([]);
  const api = useAPIClient();
  const { resource } = useResourceContext();
  const { refresh } = useResourceActionContext();
  const { modal } = App.useApp();

  const getSelectableCollections = useCallback(async () => {
    try {
      const response = await resource.selectable();
      const collections = response.data?.data || [];
      return collections.map((item) => ({
        key: item.name,
        name: item.name,
        title: item.title || item.name,
      }));
    } catch (error) {
      console.error('Failed to fetch selectable collections:', error);
      return [];
    }
  }, [api]);

  const initializeData = useCallback(async () => {
    setLoading(true);
    try {
      const selectableCollections = await getSelectableCollections();
      setAvailableCollections(selectableCollections);
      setTargetKeys([]);
    } catch (error) {
      message.error(t('Failed to initialize data'));
    } finally {
      setLoading(false);
    }
  }, [getSelectableCollections, t]);

  const handleSearch = useCallback((direction: 'left' | 'right', value: string) => {
    setSearchValue(value);
  }, []);

  const handleChange = useCallback((newTargetKeys: string[]) => {
    setTargetKeys(newTargetKeys);
  }, []);

  const handleSelectChange = useCallback((sourceSelectedKeys: string[], targetSelectedKeys: string[]) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (targetKeys.length === 0) {
      message.warning(t('Please select at least one collection'));
      return;
    }

    try {
      setLoading(true);

      modal.confirm({
        title: t('Confirm Load Collections'),
        content: t('Are you sure you want to load {{count}} collection(s)?', { count: targetKeys.length }),
        onOk: async () => {
          try {
            await resource.add({
              values: targetKeys,
            });

            message.success(t('Collections loaded successfully'));
            setOpen(false);
            setTargetKeys([]);
            setSelectedKeys([]);
            setSearchValue('');
          } catch (error) {
            console.error('Failed to load collections:', error);
            message.error(t('Failed to load collections'));
          }
        },
      });
    } catch (error) {
      message.error(t('Failed to load collections'));
    } finally {
      setLoading(false);
    }
  }, [targetKeys, api, t, modal, refresh]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    setTargetKeys([]);
    setSelectedKeys([]);
    setSearchValue('');
  }, []);

  const showDrawer = useCallback(() => {
    setOpen(true);
    initializeData();
  }, [initializeData]);

  const filteredDataSource = useMemo(() => {
    if (!searchValue) return availableCollections;

    return availableCollections.filter(
      (item) =>
        item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchValue.toLowerCase())),
    );
  }, [availableCollections, searchValue]);

  return (
    <>
      <Button type="default" icon={<ImportOutlined style={{ marginRight: 4 }} />} onClick={showDrawer} {...restProps}>
        {t('Load collections')}
      </Button>

      <Drawer
        title={t('Load Collections')}
        placement="right"
        onClose={handleCancel}
        open={open}
        width={800}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              {t('Cancel')}
            </Button>
            <Button type="primary" onClick={handleSubmit} loading={loading} disabled={targetKeys.length === 0}>
              {t('Submit')} ({targetKeys.length})
            </Button>
          </div>
        }
      >
        <div style={{ height: '100%' }}>
          <Spin spinning={loading}>
            <Transfer
              dataSource={filteredDataSource}
              titles={[t('Available Collections'), t('Selected Collections')]}
              targetKeys={targetKeys}
              selectedKeys={selectedKeys}
              onChange={handleChange}
              onSelectChange={handleSelectChange}
              onSearch={handleSearch}
              render={(item) => item.title}
              showSearch
              style={{ height: '100%' }}
              listStyle={{
                width: 350,
                height: 500,
              }}
              locale={{
                itemUnit: t('item'),
                itemsUnit: t('items'),
                searchPlaceholder: t('Search collections...'),
                notFoundContent: t('No collections found'),
              }}
            />
          </Spin>
        </div>
      </Drawer>
    </>
  );
};

export default LoadCollection;
