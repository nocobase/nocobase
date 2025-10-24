/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useApp, useCollectionRecordData, useCompile, useResourceActionContext } from '@nocobase/client';
import { Button, Popconfirm, Select, Space } from 'antd';
import React, { useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDSMTranslation } from '../../locale';
import { CollectionListContext } from '../MainDataSourceManager/Configuration/CollectionFields';

export const SetFilterTargetKey = (props) => {
  const { size, style } = props;
  const api = useAPIClient();
  const { name: dataSourceKey = 'main' } = useParams();
  const record = useCollectionRecordData();
  const app = useApp();
  const [filterTargetKey, setFilterTargetKey] = useState();
  const [title, setTitle] = useState();
  const compile = useCompile();
  const collection = useMemo(() => {
    const cm = app.getCollectionManager(dataSourceKey);
    return cm.getCollection(record.name);
  }, [app, dataSourceKey, record.name]);
  const options = useMemo(() => {
    const cm = app.getCollectionManager(dataSourceKey);
    const fields = cm.getCollectionFields(record.name);
    return fields
      .filter((field) => {
        if (!field.interface) {
          return false;
        }
        const interfaceOptions = app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
          field.interface,
        );
        if (interfaceOptions?.titleUsable) {
          return true;
        }
        return false;
      })
      .map((field) => ({
        label: compile(field.uiSchema?.title),
        value: field.name,
      }));
  }, [app, compile, dataSourceKey, record.name]);
  const { refresh } = useResourceActionContext();
  const ctx = useContext(CollectionListContext);
  const { t } = useDSMTranslation();

  return (
    <div style={{ ...style }}>
      {/* 当数据表没有主键（Primary key）时，你需要配置记录唯一标识符（Record unique
      key），用于在区块中定位行记录，不配置将无法创建该表的数据区块。 */}
      {t(
        `If a collection lacks a primary key, you must configure a unique record key to locate row records within a block, failure to configure this will prevent the creation of data blocks for the collection.`,
      )}
      {size === 'small' ? <br /> : ' '}
      <Space.Compact style={{ marginTop: 5 }}>
        <Select
          onChange={(value, option: any) => {
            console.log(value, option);
            setFilterTargetKey(value);
            setTitle(option.map((v) => v['label']).join(','));
          }}
          placeholder={t('Select field')}
          size={'small'}
          options={options}
          mode="multiple"
          style={{ width: '200px' }}
        />
        <Popconfirm
          placement="bottom"
          title={
            <div style={{ width: '15em' }}>
              {title
                ? t(
                    'Are you sure you want to set the "{{title}}" field as a record unique key? This setting cannot be changed after it\'s been set.',
                    { title },
                  )
                : t('Please select a field.')}
            </div>
          }
          onConfirm={async () => {
            if (!filterTargetKey) {
              return;
            }
            if (dataSourceKey === 'main') {
              await api.request({
                url: `collections:update?filterByTk=${record.name}`,
                method: 'post',
                data: {
                  filterTargetKey,
                },
              });
            } else {
              await api.request({
                url: `dataSources/${dataSourceKey}/collections:update?filterByTk=${record.name}`,
                method: 'post',
                data: {
                  filterTargetKey,
                },
              });
            }
            ctx?.refresh?.();
            refresh();
            await app.dataSourceManager.getDataSource(dataSourceKey).reload();
            collection.setOption('filterTargetKey', filterTargetKey);
          }}
        >
          <Button type={'primary'} size={'small'}>
            {t('OK')}
          </Button>
        </Popconfirm>
      </Space.Compact>
    </div>
  );
};
