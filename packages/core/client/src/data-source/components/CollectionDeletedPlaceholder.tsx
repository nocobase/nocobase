/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, Button, Result, Typography } from 'antd';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EllipsisWithTooltip, useCompile, useDesignable } from '../../schema-component';
import { useDataSource } from '../data-source/DataSourceProvider';
import { useDataSourceManager } from '../data-source';
import { DEFAULT_DATA_SOURCE_KEY } from '../../data-source/data-source/DataSourceManager';
import { useCollection } from '../collection';
import { BlockItemCard } from '../../schema-component/antd/block-item/BlockItemCard';

export interface CollectionDeletedPlaceholderProps {
  type: 'Collection' | 'Field' | 'Data Source' | 'Block template';
  name?: string | number;
  message?: string;
}

const { Text } = Typography;

/**
 * @internal
 */
export const CollectionDeletedPlaceholder: FC<CollectionDeletedPlaceholderProps> = ({ type, name, message }) => {
  const { designable, dn } = useDesignable();
  const { modal } = App.useApp();
  const { t } = useTranslation();
  const dataSource = useDataSource();
  const compile = useCompile();
  const collection = useCollection();
  const dataSourceManager = useDataSourceManager();
  const nameValue = useMemo(() => {
    if (type === 'Data Source') {
      return name;
    }
    const dataSourcePrefix =
      dataSourceManager?.getDataSources().length >= 1 && dataSource && dataSource.key !== DEFAULT_DATA_SOURCE_KEY
        ? `${compile(dataSource.displayName || dataSource.key)} > `
        : '';
    if (type === 'Collection') {
      return `${dataSourcePrefix}${name}`;
    }
    const collectionPrefix = collection
      ? `${compile(collection.title) || collection.name || collection.tableName} > `
      : '';
    return `${dataSourcePrefix}${collectionPrefix}${name}`;
  }, []);

  const blockType = useMemo(() => {
    if (type === 'Field') {
      return 'Field';
    }
    return 'Block';
  }, [type]);

  const messageValue = useMemo(() => {
    if (!name) {
      return `${t(type)} ${'name is required'}`;
    }
    if (message) {
      return `${t(type)} "${nameValue}" ${message}`;
    }
    return t(`The {{type}} "{{name}}" may have been deleted. Please remove this {{blockType}}.`, {
      type: t(type).toLocaleLowerCase(),
      name: nameValue,
      blockType: t(blockType).toLocaleLowerCase(),
    }).replaceAll('&gt;', '>');
  }, [message, nameValue, type, t, blockType]);

  if (designable) {
    if (type === 'Field') {
      return (
        <EllipsisWithTooltip ellipsis>
          <Text type="secondary">{messageValue}</Text>
        </EllipsisWithTooltip>
      );
    }

    return (
      <BlockItemCard>
        <Result
          status="404"
          subTitle={messageValue}
          extra={
            <Button
              key="Delete"
              onClick={() =>
                modal.confirm({
                  title: t('Delete block'),
                  content: t('Are you sure you want to delete it?'),
                  ...confirm,
                  onOk() {
                    dn.remove(null, { removeParentsIfNoChildren: true, breakRemoveOn: { 'x-component': 'Grid' } });
                    dn.refresh({ refreshParentSchema: true });
                  },
                })
              }
            >
              {t('Delete')}
            </Button>
          }
        />
      </BlockItemCard>
    );
  }

  return null;
};

const CollectionNotAllowView = () => {
  const { t } = useTranslation();
  const dataSource = useDataSource();
  const compile = useCompile();
  const collection = useCollection();
  const dataSourceManager = useDataSourceManager();
  const nameValue = useMemo(() => {
    const dataSourcePrefix =
      dataSourceManager?.getDataSources().length >= 1 && dataSource && dataSource.key !== DEFAULT_DATA_SOURCE_KEY
        ? `${compile(dataSource.displayName || dataSource.key)} > `
        : '';
    if (collection) {
      return `${dataSourcePrefix}${collection.name}`;
    }
    const collectionPrefix = collection
      ? `${compile(collection.title) || collection.name || collection.tableName} > `
      : '';
    return `${dataSourcePrefix}${collectionPrefix}${collection.name}`;
  }, []);

  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have view permission for collection "{{name}}"`,
      {
        name: nameValue,
      },
    ).replaceAll('&gt;', '>');
  }, [nameValue, t]);
  return (
    <BlockItemCard>
      <Result status="404" subTitle={messageValue} />
    </BlockItemCard>
  );
};

/**
 * @internal
 */
export const CollectionNotAllowViewPlaceholder: FC<any> = () => {
  const { designable } = useDesignable();

  if (designable) {
    return <CollectionNotAllowView />;
  }

  return null;
};
