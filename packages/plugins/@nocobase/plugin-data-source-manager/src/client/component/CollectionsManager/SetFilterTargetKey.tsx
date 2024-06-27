/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useApp, useCollectionRecordData, useCompile, useResourceActionContext } from '@nocobase/client';
import { Button, Popconfirm, Select, Space, Tooltip } from 'antd';
import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

export const SetFilterTargetKey = (props) => {
  const { style } = props;
  const api = useAPIClient();
  const { name: dataSourceKey = 'main' } = useParams();
  const record = useCollectionRecordData();
  const app = useApp();
  const [filterTargetKey, setFilterTargetKey] = useState();
  const [title, setTitle] = useState();
  const compile = useCompile();
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
        if (interfaceOptions.titleUsable) {
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
  return (
    <div style={{ ...style }}>
      当前表未配置
      <Tooltip title={'业务系统中用于唯一标识业务对象或记录的字段。'}>
        <a>主键</a>
      </Tooltip>
      ，无法在区块中使用，你需要指定一个字段作为主键。
      <Space.Compact style={{ marginTop: 5 }}>
        <Select
          onChange={(value, option) => {
            setFilterTargetKey(value);
            setTitle(option['label']);
          }}
          placeholder={'选择字段'}
          size={'small'}
          options={options}
        />
        <Popconfirm
          placement="bottom"
          title={<div style={{ width: '15em' }}>你确定将 {title} 字段设置为主键吗？设置成功后不可修改。</div>}
          onConfirm={async () => {
            await api.request({
              url: `dataSources/${dataSourceKey}/collections:update?filterByTk=${record.name}`,
              method: 'post',
              data: {
                filterTargetKey,
              },
            });
            refresh();
            // await app.dataSourceManager.getDataSource(dataSourceKey).reload();
            const cm = app.getCollectionManager(dataSourceKey);
            const collection = cm.getCollection(record.name);
            collection.setOption('filterTargetKey', filterTargetKey);
          }}
        >
          <Button type={'primary'} size={'small'}>
            OK
          </Button>
        </Popconfirm>
      </Space.Compact>
    </div>
  );
};
