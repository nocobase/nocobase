import { PluginManagerContext, SettingsCenterProvider, useAPIClient, useRequest } from '@nocobase/client';
import { Button, Card, Collapse, Table } from 'antd';
import { saveAs } from 'file-saver';
import React, { useContext } from 'react';
const { Panel } = Collapse;

const DuplicatorDump = () => {
  const api = useAPIClient();
  const optionsWithDisabled = [
    { label: 'migrations', value: 'migrations' },
    { label: 'applicationPlugins', value: 'applicationPlugins' },
    { label: 'applicationVersion', value: 'applicationVersion', disabled: false },
  ];
  const { data, loading } = useRequest({
    resource: 'duplicator',
    action: 'getDict',
  });

  const groups = {};

  for (const collection of data || []) {
    const moduleName = (collection.namespace || '').split('.').shift();
    if (!moduleName) {
      console.log(collection);
      continue;
    }
    groups[moduleName] = groups[moduleName] || [];
    groups[moduleName].push(collection);
  }

  const columns = [
    {
      title: '表名',
      dataIndex: 'title',
      render: (v, record) => <span>{v || record.name}</span>,
    },
    {
      title: '标识',
      dataIndex: 'name',
    },
    {
      title: 'namespace',
      dataIndex: 'namespace',
    },
  ];

  const requiredData = (data || []).filter((item) => {
    const required = item.duplicator === 'required' || item?.duplicator?.dumpable === 'required';
    return required;
  });
  return (
    <Card bordered={false}>
      <div>
        <h3>Required</h3>
        <Table
          loading={loading}
          size={'middle'}
          rowKey={'name'}
          pagination={false}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: requiredData.map((item) => item.name),
            getCheckboxProps(item) {
              const required = item.duplicator === 'required' || item?.duplicator?.dumpable === 'required';
              return {
                disabled: required,
              };
            },
          }}
          columns={columns}
          dataSource={requiredData}
          // scroll={{ y: '55vh' }}
        />
        <Button
          style={{ marginTop: 24 }}
          type={'primary'}
          onClick={async () => {
            const response = await api.request({
              url: 'duplicator:dump',
              method: 'post',
              responseType: 'blob',
            });
            const match = /filename="(.+)"/.exec(response?.headers?.['content-disposition'] || '');
            const filename = match ? match[1] : 'duplicator.nbdump';
            let blob = new Blob([response.data]);
            saveAs(blob, filename);
          }}
        >
          Dump
        </Button>
      </div>
    </Card>
  );
};

const DuplicatorRestore = () => {
  return (
    <Card bordered={false}>
      <div>Upload</div>
    </Card>
  );
};

export default function (props) {
  const ctx = useContext(PluginManagerContext);

  return (
    <SettingsCenterProvider
      settings={{
        duplicator: {
          title: 'Duplicator',
          icon: 'CloudDownloadOutlined',
          tabs: {
            dump: {
              title: 'Dump',
              component: DuplicatorDump,
            },
            restore: {
              title: 'Restore',
              component: DuplicatorRestore,
            },
          },
        },
      }}
    >
      {props.children}
    </SettingsCenterProvider>
  );
}
