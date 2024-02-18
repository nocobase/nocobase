import React, { FC, ReactNode, createContext, useContext } from 'react';
import type { DataSourceV2 } from './DataSource';
import { useDataSourceManagerV2 } from './DataSourceManagerProvider';
import { CollectionDeletedPlaceholder } from '../components/CollectionDeletedPlaceholder';
import { CardItem, useSchemaComponentContext } from '../../schema-component';
import { Button, Result } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export const DataSourceContextV2 = createContext<DataSourceV2>(null);
DataSourceContextV2.displayName = 'DataSourceContextV2';

export interface DataSourceProviderPropsV2 {
  dataSource?: string;
  children?: ReactNode;
}

export const DataSourceProviderV2: FC<DataSourceProviderPropsV2> = ({ children, dataSource }) => {
  const dataSourceManager = useDataSourceManagerV2();
  const { t } = useTranslation();
  const { refresh } = useSchemaComponentContext();
  const [_, setRandom] = React.useState(0);
  const dataSourceValue = dataSourceManager.getDataSource(dataSource);

  if (!dataSourceValue) {
    return <CollectionDeletedPlaceholder type="DataSource" name={dataSource} />;
  }

  if (dataSourceValue.status === 'loading-failed') {
    return (
      <CollectionDeletedPlaceholder
        type="DataSource"
        name={dataSourceValue.displayName || dataSource}
        message={dataSourceValue.errorMessage || 'loading failed'}
      />
    );
  }

  if (dataSourceValue.status === 'loading' || dataSourceValue.status === 'reloading') {
    return (
      <CardItem>
        <Result
          icon={<LoadingOutlined />}
          title={`${dataSourceValue.displayName || dataSource} ${t('data source')} ${t('loading')}...`}
          extra={
            <Button
              type="primary"
              onClick={() =>
                dataSourceValue.reload().then(() => {
                  refresh();
                  setRandom(Math.random());
                })
              }
            >
              {t('Refresh')}
            </Button>
          }
        />
      </CardItem>
    );
  }

  return <DataSourceContextV2.Provider value={dataSourceValue}>{children}</DataSourceContextV2.Provider>;
};

export function useDataSourceV2() {
  const context = useContext<DataSourceV2>(DataSourceContextV2);
  return context;
}

export function useDataSourceKey() {
  const context = useContext(DataSourceContextV2);
  return context?.key;
}
