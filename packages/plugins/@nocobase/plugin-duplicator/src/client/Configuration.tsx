import { useAPIClient, useCompile, Checkbox } from '@nocobase/client';
import { Button, Card, Form, Tabs, message, Modal, Table, Upload, Result } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { UploadProps } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useDuplicatorTranslation, generateNTemplate } from './locale';

interface BaseConfigurationProps {
  type: 'backup' | 'restore';
}
const ActionType = [
  { label: generateNTemplate('Backup'), value: 'backup' },
  { label: generateNTemplate('Restore'), value: 'restore' },
];
const options = [
  { label: generateNTemplate('System metadata'), value: 'meta' },
  { label: generateNTemplate('System config'), value: 'config' },
  { label: generateNTemplate('Business data'), value: 'business' },
];

const LearnMore: React.FC = () => {
  const { t } = useDuplicatorTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const dataSource = [
    {
      key: '1',
      plugin: {
        displayName: 'Hello',
        name: '@nocobase/plugin-hello',
      },
      collection: {
        title: 'Collection 1',
        name: 'collection1',
      },
    },
    {
      key: '2',
      plugin: {
        displayName: 'ACL',
        name: '@nocobase/plugin-acl',
      },
      collection: {
        title: 'Collection 2',
        name: 'collection2',
      },
    },
    {
      key: '3',
      plugin: {
        displayName: 'API keys',
        name: '@nocobase/plugin-api-keys',
      },
      collection: {
        title: 'Collection 3',
        name: 'collection3',
      },
    },
  ];

  const columns = [
    {
      title: 'Plugin',
      dataIndex: 'plugin',
      key: 'plugin',
      width: '50%',
      render: (plugin) => {
        return (
          <div>
            {plugin.displayName}
            <br />
            <div style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '0.9em' }}>{plugin.name}</div>
          </div>
        );
      },
    },
    {
      title: 'Collection',
      dataIndex: 'collection',
      key: 'collection',
      render: (collection) => {
        return (
          <div>
            {collection.title}
            <br />
            <div style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '0.9em' }}>{collection.name}</div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <a onClick={showModal}>{t('Learn more')}</a>
      <Modal width={800} open={isModalOpen} footer={null} onOk={handleOk} onCancel={handleCancel}>
        <h3> {t('System metadata')}</h3>
        <Table bordered size={'small'} dataSource={dataSource} columns={columns} />
        <h3>{t('System config')}</h3>
        <Table bordered size={'small'} dataSource={dataSource} columns={columns} />
        <h3>{t('Business data')}</h3>
        <Table bordered size={'small'} dataSource={dataSource} columns={columns} />
      </Modal>
    </>
  );
};

const { Dragger } = Upload;

const props: UploadProps = {
  name: 'file',
  multiple: true,
  action: 'https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188',
  onChange(info) {
    const { status } = info.file;
    if (status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (status === 'done') {
      message.success(`${info.file.name} file uploaded successfully.`);
    } else if (status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  },
  onDrop(e) {
    console.log('Dropped files', e.dataTransfer.files);
  },
};

const RestoreUpload: React.FC = () => (
  <Dragger {...props}>
    <p className="ant-upload-drag-icon">
      <InboxOutlined />
    </p>
    <p className="ant-upload-text">Click or drag file to this area to upload</p>
    <p className="ant-upload-hint">
      Support for a single or bulk upload. Strictly prohibited from uploading company data or other banned files.
    </p>
  </Dragger>
);

const BackupConfiguration = () => {
  const { t } = useDuplicatorTranslation();
  const compile = useCompile();
  const apiClient = useAPIClient();
  const [dataTypes, setBackupData] = useState<any[]>(['']);
  const resource = useMemo(() => {
    return apiClient.resource('duplicator');
  }, [apiClient]);
  const handleStartUp = () => {
    resource
      .dump({
        values: { dataTypes },
      })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {});
  };

  return (
    <Card bordered={false}>
      <strong style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
        {t('Select the data to be backed up')}(
        <LearnMore />
        ):
      </strong>
      <div style={{ lineHeight: 2, marginBottom: 8 }}>
        <Checkbox.Group
          options={compile(options)}
          style={{ flexDirection: 'column' }}
          onChange={(checkValue) => setBackupData(checkValue)}
        />
      </div>
      <Button type="primary" onClick={handleStartUp}>
        {t('Start backup')}
      </Button>
    </Card>
  );
};

const RestoreConfiguration = () => {
  const { t } = useDuplicatorTranslation();
  const compile = useCompile();

  return (
    <div>
      <Card bordered={false}>
        <RestoreUpload />
      </Card>
      <br />
      <br />
      <Card bordered={false}>
        <strong style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
          {t('Select the data to be restored')} (<LearnMore />
          ):
        </strong>
        <div style={{ lineHeight: 2, marginBottom: 16 }}>
          <Checkbox.Group options={compile(options)} style={{ flexDirection: 'column' }} />
        </div>
        <Button type="primary">{t('Start restore')}</Button>
      </Card>
    </div>
  );
};

const components = {
  backup: BackupConfiguration,
  restore: RestoreConfiguration,
};

const tabList = ActionType.map((item) => {
  return {
    ...item,
    component: components[item.value],
  };
});

export const Configuration = () => {
  const compile = useCompile();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  return (
    <Card bordered>
      <Tabs type="card" defaultActiveKey={search.get('tab')}>
        {tabList.map((tab) => {
          return (
            <Tabs.TabPane key={tab.value} tab={compile(tab.label)}>
              <tab.component type={tab.value} />
            </Tabs.TabPane>
          );
        })}
      </Tabs>
    </Card>
  );
};
