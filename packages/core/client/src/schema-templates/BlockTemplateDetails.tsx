import { Input, PageHeader as AntdPageHeader, Spin } from 'antd';
import React, { useContext, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useAPIClient, useRequest, useSchemaTemplateManager } from '..';
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
  const history = useHistory();
  const match = useRouteMatch<any>();
  const key = match?.params?.key;
  const value = useContext(SchemaComponentContext);
  const { data, loading } = useRequest({
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
        onBack={() => {
          history.push('/admin/plugins/block-templates');
        }}
        ghost={false}
        title={<EditableTitle filterByTk={key} title={data?.data?.name} />}
      />
      <div style={{ margin: 24 }}>
        <SchemaComponentContext.Provider value={{ ...value, designable: true }}>
          <RemoteSchemaComponent uid={data?.data?.uid} />
        </SchemaComponentContext.Provider>
      </div>
    </div>
  );
};
