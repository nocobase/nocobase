/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageHeader as AntdPageHeader } from '@ant-design/pro-layout';
import { Input, Spin } from 'antd';
import React, { useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAPIClient, useRequest, useSchemaTemplateManager } from '..';
import { useNavigateNoUpdate } from '../application/CustomRouterContextProvider';
import { RemoteSchemaComponent, SchemaComponentContext } from '../schema-component';

const EditableTitle = (props) => {
  const [title, setTitle] = useState(props.title);
  const [visible, setVisible] = useState(false);
  const { refresh } = useSchemaTemplateManager();
  const api = useAPIClient();
  const { run } = useRequest(
    {
      resource: 'uiSchemaTemplates',
      action: 'update',
      params: {
        filterByTk: props.filterByTk,
      },
    },
    {
      manual: true,
      debounceWait: 500,
      onSuccess() {
        refresh();
      },
    },
  );
  return (
    <div>
      {visible ? (
        <Input
          defaultValue={title}
          size={'large'}
          onBlur={() => {
            setVisible(false);
          }}
          onChange={(e) => {
            setTitle(e.target.value);
            run({
              filterByTk: props.filterByTk,
              values: {
                name: e.target.value,
              },
            });
          }}
        />
      ) : (
        <div
          onClick={() => {
            setVisible(true);
          }}
        >
          {title || <span style={{ color: '#bbb' }}>未命名</span>}
        </div>
      )}
    </div>
  );
};

export const BlockTemplateDetails = () => {
  const navigate = useNavigateNoUpdate();
  const params = useParams<any>();
  const key = params?.key;
  const value = useContext(SchemaComponentContext);
  const schemaComponentContext = useMemo(() => ({ ...value, designable: true }), [value]);

  const { data, loading } = useRequest<{
    data: any;
  }>({
    resource: 'uiSchemaTemplates',
    action: 'get',
    params: {
      filterByTk: key,
    },
  });

  if (loading) {
    return <Spin />;
  }

  return (
    <div>
      <AntdPageHeader
        style={{ backgroundColor: 'white' }}
        onBack={() => {
          navigate('/admin/plugins/block-templates');
        }}
        ghost={false}
        title={<EditableTitle filterByTk={key} title={data?.data?.name} />}
      />
      <div style={{ margin: 'var(--nb-spacing)' }}>
        <SchemaComponentContext.Provider value={schemaComponentContext}>
          <RemoteSchemaComponent uid={data?.data?.uid} />
        </SchemaComponentContext.Provider>
      </div>
    </div>
  );
};
