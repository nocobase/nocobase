import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { useCollectionManagerV2 } from '../collection/CollectionManagerProvider';
import { Button, Result } from 'antd';
import { CollectionDeletedPlaceholder } from './CollectionDeletedPlaceholder';
import { CardItem } from '../../schema-component';
import { LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export const CollectionDataSourceName = createContext<string>(undefined);
CollectionDataSourceName.displayName = 'CollectionDataSourceName';

export const CollectionDataSourceProvider: FC<{ dataSource: string; children?: ReactNode }> = ({
  dataSource,
  children,
}) => {
  const cm = useCollectionManagerV2();
  const { t } = useTranslation();
  const dataSourceData = useMemo(() => cm.getDataSource(dataSource), [cm, dataSource]);
  if (!dataSourceData) {
    return <CollectionDeletedPlaceholder type="DataSource" name={dataSource}></CollectionDeletedPlaceholder>;
  }

  if (dataSourceData.status === 'failed') {
    return <Result status="error" title={dataSourceData.errorMessage} />;
  }

  if (dataSourceData.status === 'loading') {
    return (
      <CardItem>
        <Result
          icon={<LoadingOutlined />}
          title={`${dataSource} ${t('data source')} ${t('loading')}...`}
          extra={
            <Button type="primary" onClick={() => cm.reloadThirdDataSource()}>
              Refresh
            </Button>
          }
        />
      </CardItem>
    );
  }

  return <CollectionDataSourceName.Provider value={dataSource}>{children}</CollectionDataSourceName.Provider>;
};

export const useCollectionDataSourceName = () => {
  return useContext(CollectionDataSourceName);
};
