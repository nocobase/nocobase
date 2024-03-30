import { App, Button, Result, Typography } from 'antd';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CardItem, EllipsisWithTooltip, useCompile, useDesignable } from '../../schema-component';
import { useDataSource } from '../data-source/DataSourceProvider';
import { useDataSourceManager } from '../data-source';
import { DEFAULT_DATA_SOURCE_KEY } from '../../data-source/data-source/DataSourceManager';
import { useCollection } from '../collection';

export interface CollectionDeletedPlaceholderProps {
  type: 'Collection' | 'Field' | 'DataSource';
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
    if (type === 'DataSource') {
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
      blockType: t(blockType),
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
      <CardItem>
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
                  },
                })
              }
            >
              {t('Delete')}
            </Button>
          }
        />
      </CardItem>
    );
  }

  return null;
};
