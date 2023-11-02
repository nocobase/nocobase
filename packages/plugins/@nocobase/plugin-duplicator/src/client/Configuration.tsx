import { useAPIClient, useCompile, Checkbox } from '@nocobase/client';
import { Button, Card, Tabs, message, Modal, Table, Upload, Result } from 'antd';
import React, { useMemo, useState } from 'react';
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
function useUploadProps(props: UploadProps): any {
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
  const [dataSource, setDataSource] = useState<any>();
  const compile = useCompile();
  const showModal = async () => {
    const data = await apiClient.request({
      url: 'duplicator:dumpableCollections',
      method: 'get',
    });
    setDataSource(data?.data);
    console.log(data?.data);
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
      title: t('Plugin'),
      dataIndex: 'plugin',
      key: 'plugin',
      width: '50%',
      render: (_, { origin: plugin }) => {
        return (
          <div>
            {plugin.title}
            <br />
            <div style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '0.9em' }}>{plugin.name}</div>
          </div>
        );
      },
    },
    {
      title: t('Collection'),
      dataIndex: 'collection',
      key: 'collection',
      render: (_, collection) => {
        return (
          <div>
            {compile(collection.title)}
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
        <Table bordered size={'small'} dataSource={dataSource?.meta} columns={columns} />
        <h3>{t('System config')}</h3>
        <Table bordered size={'small'} dataSource={dataSource?.config} columns={columns} />
        <h3>{t('Business data')}</h3>
        <Table bordered size={'small'} dataSource={dataSource?.business} columns={columns} />
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
  const handleStartBackUp = () => {
    setOpen(true);
    apiClient
      .request({
        url: 'duplicator:dump',
        method: 'post',
        data: {
          dataTypes,
        },
        responseType: 'blob',
      })
      .then((response) => {
        setFileData(response);
      })
      .catch((err) => {
        setOpen(false);
      });
  };
  const handleDownload = () => {
    const blob = new Blob([fileData?.data]);
    const match = /filename="(.+)"/.exec(fileData?.headers?.['content-disposition'] || '');
    const filename = match ? match[1] : 'duplicator.nbump';
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
    multiple: false,
    action: '/duplicator:upload',
    onChange(info) {
      if (info.fileList.length > 1) {
        info.fileList.splice(0, info.fileList.length - 1); // 只保留一个文件
      }
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
        setRestoreData(info.file.response?.data);
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
    </Dragger>
  );
};

const RestoreConfiguration = () => {
  const { t } = useDuplicatorTranslation();
  const compile = useCompile();
  const apiClient = useAPIClient();
  const [dataTypes, setDataTypes] = useState<any[]>(['meta']);
  const [restoreData, setRestoreData] = useState(null);
  const resource = useMemo(() => {
    return apiClient.resource('duplicator');
  }, [apiClient]);

  const handleStartRestore = () => {
    resource.restore({
      values: { dataTypes, key: restoreData.key },
    });
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
          <Checkbox.Group
            options={compile(
              options.map((v) => {
                return { ...v, disabled: !restoreData?.meta?.dataTypes?.includes(v.value) || v.disabled };
              }),
            )}
            style={{ flexDirection: 'column' }}
            defaultValue={dataTypes}
            onChange={(checkValue) => setDataTypes(checkValue)}
          />
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
