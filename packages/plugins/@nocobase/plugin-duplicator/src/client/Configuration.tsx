import { useAPIClient, useCompile, Checkbox } from '@nocobase/client';
import { Button, Card, Form, Tabs, message, Modal, Table, Upload, Result } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { UploadProps } from 'antd';
import { saveAs } from 'file-saver';
import { InboxOutlined, LoadingOutlined } from '@ant-design/icons';
import { useDuplicatorTranslation, generateNTemplate } from './locale';

const { Dragger } = Upload;
const ActionType = [
  { label: generateNTemplate('Backup'), value: 'backup' },
  { label: generateNTemplate('Restore'), value: 'restore' },
];
const options = [
  { label: generateNTemplate('System metadata'), value: 'meta', disabled: true },
  { label: generateNTemplate('System config'), value: 'config' },
  { label: generateNTemplate('Business data'), value: 'business' },
];
function extractFileName(contentDispositionHeader) {
  const regex = /filename="([^"]+)"/;
  const match = contentDispositionHeader.match(regex);
  if (match && match.length > 1) {
    return match[1];
  } else {
    return null;
  }
}
function useUploadProps(props: UploadProps) {
  const onChange = (param) => {
    props.onChange?.(param);
  };

  const api = useAPIClient();

  return {
    ...props,
    customRequest({ action, data, file, filename, headers, onError, onProgress, onSuccess, withCredentials }) {
      const formData = new FormData();
      if (data) {
        Object.keys(data).forEach((key) => {
          formData.append(key, data[key]);
        });
      }
      formData.append(filename, file);
      // eslint-disable-next-line promise/catch-or-return
      api.axios
        .post(action, formData, {
          withCredentials,
          headers,
          onUploadProgress: ({ total, loaded }) => {
            onProgress({ percent: Math.round((loaded / total) * 100).toFixed(2) }, file);
          },
        })
        .then(({ data }) => {
          onSuccess(data, file);
        })
        .catch(onError)
        .finally(() => {});

      return {
        abort() {
          console.log('upload progress is aborted.');
        },
      };
    },
    onChange,
  };
}

const LearnMore: React.FC = () => {
  const { t } = useDuplicatorTranslation();
  const apiClient = useAPIClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = async () => {
    const data = await apiClient.request({
      url: 'duplicator:dumpableCollections',
      method: 'get',
    });
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

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
        <Table bordered size={'small'} columns={columns} />
        <h3>{t('System config')}</h3>
        <Table bordered size={'small'} columns={columns} />
        <h3>{t('Business data')}</h3>
        <Table bordered size={'small'} columns={columns} />
      </Modal>
    </>
  );
};

const BackupConfiguration = () => {
  const { t } = useDuplicatorTranslation();
  const compile = useCompile();
  const apiClient = useAPIClient();
  const [open, setOpen] = useState(false);
  const [dataTypes, setBackupData] = useState<any[]>(['meta']);
  const [fileData, setFileData] = useState(null);
  const resource = useMemo(() => {
    return apiClient.resource('duplicator');
  }, [apiClient]);
  const handleStartBackUp = () => {
    setOpen(true);
    resource
      .dump({
        values: { dataTypes },
      })
      .then((res) => {
        console.log(res);
        setFileData(res);
      })
      .catch((err) => {
        setOpen(false);
      });
  };
  const handleDownload = () => {
    const blob = new Blob([fileData?.data], { type: fileData?.headers?.['content-type'] });
    const filename = extractFileName(fileData?.headers?.['content-disposition']);
    console.log(filename, fileData?.headers?.['content-disposition']);
    saveAs(blob, filename);
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
          defaultValue={dataTypes}
        />
      </div>
      <Modal open={open} footer={null} onCancel={() => setOpen(false)}>
        <div>
          {!fileData ? (
            <Result icon={<LoadingOutlined />} title="Backing up" />
          ) : (
            <Result
              status="success"
              title={t('Backed up successfully')}
              extra={[
                <Button type="primary" key="download" onClick={handleDownload}>
                  {t('Download')}
                </Button>,
              ]}
            />
          )}
        </div>
      </Modal>
      <Button type="primary" onClick={handleStartBackUp}>
        {t('Start backup')}
      </Button>
    </Card>
  );
};

const RestoreUpload = (props: any) => {
  const { setRestoreData } = props;
  const { t } = useDuplicatorTranslation();
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    action: '/duplicator:upload',
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

  return (
    <Dragger {...useUploadProps(uploadProps)}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text"> {t('Click or drag file to this area to upload')}</p>
      <p className="ant-upload-hint">
        {t(
          ' Support for a single or bulk upload. Strictly prohibited from uploading company data or other banned files.',
        )}
      </p>
    </Dragger>
  );
};

const RestoreConfiguration = () => {
  const { t } = useDuplicatorTranslation();
  const compile = useCompile();
  const apiClient = useAPIClient();
  const [dataTypes, setBackupData] = useState<any[]>(['meta']);
  const [restoreData, setRestoreData] = useState(null);
  const resource = useMemo(() => {
    return apiClient.resource('duplicator');
  }, [apiClient]);
  const handleStartRestore = () => {
    resource
      .restore({
        values: { dataTypes },
      })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {});
  };
  return (
    <div>
      <Card bordered={false}>
        <RestoreUpload setRestoreData={setRestoreData} />
      </Card>
      <br />
      <br />
      <Card bordered={false}>
        <strong style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
          {t('Select the data to be restored')} (<LearnMore />
          ):
        </strong>
        <div style={{ lineHeight: 2, marginBottom: 16 }}>
          <Checkbox.Group options={compile(options)} style={{ flexDirection: 'column' }} defaultValue={dataTypes} />
        </div>
        <Button type="primary" onClick={handleStartRestore} disabled={!restoreData}>
          {t('Start restore')}
        </Button>
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
